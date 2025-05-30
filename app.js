const express = require("express");
const path = require("path");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const pool = require("./configuracion/conexionBD");
const app = express();

app.use((req, res, next) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "publico")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "vistas"));

app.get('/inicio', (req, res) => {
  res.render('inicio/index', {
    success: req.query.success,
    error: req.query.error
  });
});

// Procesa el motivo de ingreso
app.post("/proceso-ingreso", (req, res) => {
  const { motivo } = req.body;
  switch (motivo) {
    case "emergencia":
      return res.redirect("/admisiones?emergencia=true");
    case "cita":
      return res.redirect("/turno");
    case "derivacion":
      return res.redirect("/derivacion");
    default:
      return res.redirect("/inicio");
  }
});

// Formulario de admisión
app.get("/", (req, res) => res.render("admisiones/formulario"));
app.post("/admisiones", (req, res) => {
  console.log("Admisión recibida:", req.body);
  res.redirect("/inicio");
});

// Sacar Turno
app.get("/turno", async (req, res) => {
  try {
    // Forzar cliente a UTF8
    await pool.query("SET client_encoding = 'UTF8';");
    const { rows: pacientes } = await pool.query(
      "SELECT id, nombre FROM pacientes ORDER BY nombre"
    );
    res.render("admisiones/turno", { pacientes });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar pacientes");
  }
});

// Derivación Médica
app.get("/derivacion", async (req, res) => {
  try {
    await pool.query("SET client_encoding = 'UTF8';");
    const { rows: pacientes } = await pool.query(
      "SELECT id, nombre FROM pacientes ORDER BY nombre"
    );
    const { rows: medicos } = await pool.query(
      "SELECT id, nombre FROM medicos ORDER BY nombre"
    );
    res.render("admisiones/derivacion", { pacientes, medicos });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar datos");
  }
});

app.get("/habitaciones", (req, res) => {
  // Datos de ejemplo; luego reemplazá por una consulta real
  const alas = [
    {
      nombre: "Ala 1",
      habitaciones: [
        {
          nombre: "Habitación A",
          camas: [
            { id: 1, estado: "libre_higienizada", sexo: null },
            { id: 2, estado: "ocupada", sexo: "M" },
          ],
        },
        {
          nombre: "Habitación B",
          camas: [
            { id: 3, estado: "libre_sin_higienizar", sexo: null },
            { id: 4, estado: "ocupada", sexo: "F" },
          ],
        },
      ],
    },
    {
      nombre: "Ala 2",
      habitaciones: [
        {
          nombre: "Habitación A",
          camas: [{ id: 1, estado: "libre_higienizada", sexo: null }],
        },
        {
          nombre: "Habitación B",
          camas: [
            { id: 2, estado: "ocupada", sexo: "F" },
            { id: 3, estado: "ocupada", sexo: "F" },
          ],
        },
      ],
    },
    {
      nombre: "Emergencias",
      habitaciones: [
        {
          nombre: "Sala de Emergencia",
          camas: [
            { id: 1, estado: "libre_higienizada", sexo: null },
            { id: 2, estado: "ocupada", sexo: "F" },
          ],
        },
      ],
    },
  ];

  res.render("habitaciones/index", { alas });
});

app.get("/habitaciones", async (req, res) => {
  const alas = await pool.query(`
    SELECT a.id AS ala_id, a.nombre AS ala,
           h.id AS hab_id, h.nombre AS habitacion,
           c.id AS cama_id, c.estado, c.sexo,
           p.nombre AS paciente
    FROM alas a
    JOIN habitaciones h ON h.ala_id = a.id
    LEFT JOIN camas c ON c.habitacion_id = h.id
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    ORDER BY a.id, h.id, c.id
  `);
  // Transformá rows a la estructura {alas:[{nombre, habitaciones:[{nombre,camas:[...]}]}]}
  const data = {};
  alas.rows.forEach((r) => {
    if (!data[r.ala_id]) data[r.ala_id] = { nombre: r.ala, habitaciones: {} };
    const ala = data[r.ala_id];
    if (!ala.habitaciones[r.hab_id])
      ala.habitaciones[r.hab_id] = {
        nombre: r.habitacion,
        camas: [],
      };
    ala.habitaciones[r.hab_id].camas.push({
      id: r.cama_id,
      estado: r.estado,
      sexo: r.sexo,
      paciente: r.paciente,
    });
  });
  res.render("habitaciones/index", {
    alas: Object.values(data).map((a) => ({
      nombre: a.nombre,
      habitaciones: Object.values(a.habitaciones),
    })),
  });
});

//
// CRUD de camas
//
app.post("/camas", async (req, res) => {
  // Crear cama nueva en una habitación
  const { habitacion_id } = req.body;
  await pool.query(`INSERT INTO camas (habitacion_id) VALUES ($1)`, [
    habitacion_id,
  ]);
  res.sendStatus(201);
});

app.put("/camas/:id", async (req, res) => {
  // Modificar estado/sexo/paciente de la cama
  const { id } = req.params;
  const { estado, sexo, paciente_id } = req.body;
  await pool.query(
    `UPDATE camas SET estado=$1, sexo=$2, paciente_id=$3 WHERE id=$4`,
    [estado, sexo || null, paciente_id || null, id]
  );
  res.sendStatus(204);
});

app.delete("/camas/:id", async (req, res) => {
  await pool.query(`DELETE FROM camas WHERE id=$1`, [req.params.id]);
  res.sendStatus(204);
});

// Muestra el formulario de motivo de emergencia
app.get('/emergencia', (req, res) => {
  res.render('admisiones/emergencia');
});

// Procesa la emergencia y asigna cama en el ala de emergencias
app.post('/emergencia/asignar', async (req, res) => {
  const { motivo } = req.body;
  try {
    // 1. Buscar una cama libre e higienizada en el ala de Emergencias
    const result = await pool.query(
      `SELECT camas.id AS cama_id, habitaciones.id AS habitacion_id
       FROM camas
       JOIN habitaciones ON habitaciones.id = camas.habitacion_id
       JOIN alas ON alas.id = habitaciones.ala_id
       WHERE alas.nombre ILIKE 'Emergencias'
         AND camas.estado = 'libre_higienizada'
       LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.send('No hay camas de emergencia disponibles.');
    }
    const camaId = result.rows[0].cama_id;

    // 2. Insertar un paciente "anónimo de emergencia" (o lo que decidas, aquí ejemplo simple)
    const insertPaciente = await pool.query(
      `INSERT INTO pacientes (nombre, motivo, emergencia, fecha_registro)
       VALUES ($1, $2, true, NOW())
       RETURNING id`,
      ['Emergencia', motivo]
    );
    const pacienteId = insertPaciente.rows[0].id;

    // 3. Asignar la cama
    await pool.query(
      `UPDATE camas SET estado = 'ocupada', paciente_id = $1, sexo = NULL WHERE id = $2`,
      [pacienteId, camaId]
    );

    // 4. Redireccionar a una vista de habitaciones (o mostrarle su cama asignada)
    res.redirect('/habitaciones?emergencia_ok=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al asignar cama de emergencia.');
  }
});
// REGISTRO STAFF

app.post('/registro-staff', async (req, res) => {
  const { nombre, usuario, email, password, especialidad, codigo_registro } = req.body;
  const CODIGO_CORRECTO = process.env.CODIGO_REGISTRO_STAFF || 'SOYMEDICO2024';
  if (codigo_registro !== CODIGO_CORRECTO) {
    return res.send('Código de registro incorrecto. Sólo personal autorizado puede registrarse.');
  }
  try {
    const existe = await pool.query(
      'SELECT 1 FROM medicos WHERE usuario = $1 OR email = $2',
      [usuario, email]
    );
    if (existe.rowCount) {
      return res.send('El usuario o email ya está registrado');
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO medicos (nombre, usuario, email, password, especialidad) VALUES ($1, $2, $3, $4, $5)',
      [nombre, usuario, email, hash, especialidad]
    );
    res.redirect('/inicio?success=staff');
  } catch (err) {
    return res.redirect('/inicio?error=usuario_existente');
  }
});

// LOGIN STAFF
app.post('/login/staff', async (req, res) => {
  const { usuario, password } = req.body;
  const result = await pool.query(
    'SELECT * FROM medicos WHERE usuario = $1 OR email = $1',
    [usuario]
  );
  if (!result.rowCount) return res.send('Usuario no encontrado');
  const medico = result.rows[0];
  const valido = await bcrypt.compare(password, medico.password);
  if (!valido) return res.send('Contraseña incorrecta');
  res.redirect('/habitaciones');
});

// REGISTRO PACIENTE
app.post('/registro-paciente', async (req, res) => {
  const { nombre, email, password, telefono, sexo } = req.body;
  try {
    const existe = await pool.query('SELECT 1 FROM pacientes WHERE email = $1', [email]);
    if (existe.rowCount) {
      return res.redirect('/inicio?error=usuario_existente');
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO pacientes (nombre, email, password, telefono, sexo) VALUES ($1, $2, $3, $4, $5)',
      [nombre, email, hash, telefono, sexo]
    );
    res.redirect('/inicio?success=paciente');
  } catch (err) {
    return res.redirect('/inicio?error=error');
  }
});


const PUERTO = process.env.PUERTO || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});