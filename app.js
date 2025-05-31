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
app.use(express.json());
app.use(express.static(path.join(__dirname, "publico")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "vistas"));

// INICIO
app.get('/inicio', (req, res) => {
  res.render('inicio/index', {
    success: req.query.success,
    error: req.query.error,
    showSideBar: false
  });
});

// REGISTRO PACIENTE - Validación backend
app.post('/registro-paciente', async (req, res) => {
  const { nombre, email, password, telefono, sexo } = req.body;
  const nombreOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,60}$/.test(nombre);
  const emailOk = /^[^@]+@[^@]+\.[^@]+$/.test(email);
  const telOk = /^[0-9\-+ ]{8,20}$/.test(telefono);

  if(!nombreOk) return res.redirect('/inicio?error=Nombre inválido');
  if(!emailOk) return res.redirect('/inicio?error=Email inválido');
  if(!telOk) return res.redirect('/inicio?error=Teléfono inválido');

  try {
    const existe = await pool.query('SELECT 1 FROM pacientes WHERE email = $1', [email]);
    if (existe.rowCount) return res.redirect('/inicio?error=usuario_existente');
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO pacientes (nombre, email, password, telefono, sexo) VALUES ($1, $2, $3, $4, $5)',
      [nombre, email, hash, telefono, sexo]
    );
    res.redirect('/inicio?success=paciente');
  } catch (err) {
    return res.redirect('/inicio?error=Ocurrió un error inesperado');
  }
});

// REGISTRO STAFF
app.post('/registro-staff', async (req, res) => {
  const { nombre, usuario, email, password, especialidad, codigo_registro } = req.body;
  const CODIGO_CORRECTO = process.env.CODIGO_REGISTRO_STAFF || 'SOYMEDICO2024';
  if(!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,60}$/.test(nombre)) return res.redirect('/inicio?error=Nombre inválido');
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return res.redirect('/inicio?error=Email inválido');
  if(!/^[a-zA-Z0-9_]{4,}$/.test(usuario)) return res.redirect('/inicio?error=Usuario inválido');

  if (codigo_registro !== CODIGO_CORRECTO) {
    return res.redirect('/inicio?error=codigo');
  }
  try {
    const existe = await pool.query(
      'SELECT 1 FROM medicos WHERE usuario = $1 OR email = $2',
      [usuario, email]
    );
    if (existe.rowCount) {
      return res.redirect('/inicio?error=usuario_existente');
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
  if (!result.rowCount) return res.redirect('/inicio?error=usuario_existente');
  const medico = result.rows[0];
  const valido = await bcrypt.compare(password, medico.password);
  if (!valido) return res.redirect('/inicio?error=error');
  res.redirect('/habitaciones');
});

// LOGIN PACIENTE
app.post('/login/paciente', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query(
    'SELECT * FROM pacientes WHERE email = $1',
    [email]
  );
  if (!result.rowCount) return res.redirect('/inicio?error=usuario_existente');
  const paciente = result.rows[0];
  const valido = await bcrypt.compare(password, paciente.password);
  if (!valido) return res.redirect('/inicio?error=error');
  res.redirect('/turno');
});

// Procesa el motivo de ingreso (deja solo esta vez)
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
    await pool.query("SET client_encoding = 'UTF8';");
    const { rows: pacientes } = await pool.query(
      "SELECT id, nombre FROM pacientes ORDER BY nombre"
    );
    res.render("admisiones/turno", { pacientes });
  } catch (err) {
    console.error("ERROR EN /derivacion:", err);
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
    console.error("ERROR EN /derivacion:", err);
    res.status(500).send("Error al cargar datos");
  }
});

//habitaciones
app.get("/habitaciones", async (req, res) => {
  const alas = await pool.query(`
    SELECT a.id AS ala_id, a.nombre AS ala,
           h.id AS hab_id, h.nombre AS habitacion,
           c.id AS cama_id, c.estado, c.sexo,
           p.nombre AS paciente
    FROM alas a
    LEFT JOIN habitaciones h ON h.ala_id = a.id
    LEFT JOIN camas c ON c.habitacion_id = h.id
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    ORDER BY a.id, h.id, c.id
  `);

  const data = {};
  alas.rows.forEach((r) => {
    if (!data[r.ala_id]) data[r.ala_id] = { nombre: r.ala, habitaciones: {} };
    if (r.hab_id) {
      const ala = data[r.ala_id];
      if (!ala.habitaciones[r.hab_id])
        ala.habitaciones[r.hab_id] = {
          nombre: r.habitacion,
          camas: [],
        };
      if (r.cama_id) {
        ala.habitaciones[r.hab_id].camas.push({
          id: r.cama_id,
          estado: r.estado,
          sexo: r.sexo,
          paciente: r.paciente,
        });
      }
    }
  });

  res.render("habitaciones/index", {
    alas: Object.values(data).map((a) => ({
      nombre: a.nombre,
      habitaciones: Object.values(a.habitaciones),
    })),
    showSidebar: true // mantiene la barra lateral activa
  });
});

// CREAR CAMAS NUEVAS EN HABITACIONES
app.post("/camas", async (req, res) => {
  const { habitacion_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO camas (habitacion_id, estado) VALUES ($1, 'libre_higienizada')`,
      [habitacion_id]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



// 1) API: pacientes por ala (solo los internados sin fecha_egreso)
app.get("/api/pacientes-con-turno", async (req, res) => {
  const { ala } = req.query;
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.nombre, p.dni
      FROM internaciones i
      JOIN pacientes   p ON p.id = i.paciente_id
      JOIN habitaciones h ON h.id = i.habitacion_id
      JOIN alas       a ON a.id = h.ala_id
      WHERE a.nombre = $1
        AND i.fecha_egreso IS NULL
      ORDER BY p.nombre
    `, [ala]);
    res.json(rows);
  } catch (e) {
    console.error("Error en /api/pacientes-con-turno:", e);
    res.status(500).json([]);
  }
});

// Mostrar el CRUD de Alas
app.get("/alas", async (req, res) => {
  try {
    const { rows: alas } = await pool.query("SELECT id, nombre FROM alas ORDER BY id");
    res.render("habitaciones/alas", {
      alas,
      success: req.query.success,
      error: req.query.error,
      showSidebar: true
    });
  } catch (err) {
    console.error("ERROR en GET /alas:", err);
    res.redirect("/alas?error=Ocurrió un error al cargar las alas");
  }
});

// Crear un Ala
app.post("/alas", async (req, res) => {
  const { nombre } = req.body;
  try {
    await pool.query("INSERT INTO alas (nombre) VALUES ($1)", [nombre]);
    res.redirect("/alas?success=ala_creada");
  } catch (err) {
    console.error("ERROR en POST /alas:", err);
    res.redirect("/alas?error=No se pudo crear el ala");
  }
});

// Editar nombre del Ala
app.post("/alas/:id/edit", async (req, res) => {
  const { id }     = req.params;
  const { nombre } = req.body;
  try {
    await pool.query("UPDATE alas SET nombre = $1 WHERE id = $2", [nombre, id]);
    res.redirect("/alas?success=ala_modificada");
  } catch (err) {
    console.error("ERROR en POST /alas/:id/edit:", err);
    res.redirect("/alas?error=No se pudo modificar el ala");
  }
});

// Eliminar un Ala
app.post("/alas/:id/delete", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM alas WHERE id = $1", [id]);
    res.redirect("/alas?success=ala_eliminada");
  } catch (err) {
    console.error("ERROR en POST /alas/:id/delete:", err);
    res.redirect("/alas?error=No se pudo eliminar el ala");
  }
});

// Emergencia
app.get('/emergencia', (req, res) => {
  res.render('admisiones/emergencia');
});

app.post('/emergencia/asignar', async (req, res) => {
  const { motivo } = req.body;
  try {
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

    const insertPaciente = await pool.query(
      `INSERT INTO pacientes (nombre, motivo, emergencia, fecha_registro)
       VALUES ($1, $2, true, NOW())
       RETURNING id`,
      ['Emergencia', motivo]
    );
    const pacienteId = insertPaciente.rows[0].id;

    await pool.query(
      `UPDATE camas SET estado = 'ocupada', paciente_id = $1, sexo = NULL WHERE id = $2`,
      [pacienteId, camaId]
    );
    res.redirect('/habitaciones?emergencia_ok=1');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al asignar cama de emergencia.');
  }
});

const PUERTO = process.env.PUERTO || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
