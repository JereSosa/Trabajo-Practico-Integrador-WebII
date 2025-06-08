const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pool = require("./configuracion/conexionBD");
require("dotenv").config();

const app = express();

// Middleware configuración general
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "publico")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "vistas"));

// Configuración de sesión
app.use(session({
  secret: 'clave_super_segura',
  resave: false,
  saveUninitialized: true,
}));

// Middleware UTF-8
app.use((req, res, next) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  next();
});

// Ruta raíz
app.get("/", (req, res) => res.redirect("/inicio"));

// Ruta Inicio
app.get('/inicio', (req, res) => {
  res.render('inicio/index', {
    success: req.query.success,
    error: req.query.error,
    showSideBar: false,
    usuario: req.session.usuario
  });
});

// Registro de Pacientes
app.post('/registro-paciente', async (req, res) => {
  const { nombre, email, password, telefono, sexo } = req.body;

  const nombreOk = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,60}$/.test(nombre);
  const emailOk = /^[^@]+@[^@]+\.[^@]+$/.test(email);
  const telOk = /^[0-9\-+ ]{8,20}$/.test(telefono);

  if (!nombreOk) return res.redirect('/inicio?error=Nombre inválido');
  if (!emailOk) return res.redirect('/inicio?error=Email inválido');
  if (!telOk) return res.redirect('/inicio?error=Teléfono inválido');

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
    console.error("Error en registro paciente:", err);
    return res.redirect('/inicio?error=Ocurrió un error inesperado');
  }
});

// Registro del Staff Médico
app.post('/registro-staff', async (req, res) => {
  const { nombre, usuario, email, password, especialidad, codigo_registro } = req.body;
  const CODIGO_CORRECTO = process.env.CODIGO_REGISTRO_STAFF || 'SOYMEDICO2024';

  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,60}$/.test(nombre))
    return res.redirect('/inicio?error=Nombre inválido');
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
    return res.redirect('/inicio?error=Email inválido');
  if (!/^[a-zA-Z0-9_]{4,}$/.test(usuario))
    return res.redirect('/inicio?error=Usuario inválido');

  if (codigo_registro !== CODIGO_CORRECTO) {
    return res.redirect('/inicio?error=codigo');
  }

  try {
    const existe = await pool.query(
      'SELECT 1 FROM medicos WHERE usuario = $1 OR email = $2',
      [usuario, email]
    );
    if (existe.rowCount) return res.redirect('/inicio?error=usuario_existente');

    const hash = await bcrypt.hash(password, 10);
    const nuevoMedico = await pool.query(
      'INSERT INTO medicos (nombre, usuario, email, password, especialidad) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre, usuario, email, hash, especialidad]
    );

    req.session.usuario = {
      id: nuevoMedico.rows[0].id,
      nombre,
      rol: 'doctor'
    };

    res.redirect('/inicio?success=staff');
  } catch (err) {
    console.error("Error en registro staff:", err);
    return res.redirect('/inicio?error=usuario_existente');
  }
});

// Login del Staff Médico
app.post('/login/staff', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM medicos WHERE usuario = $1 OR email = $1',
      [usuario]
    );

    if (!result.rowCount) return res.redirect('/inicio?error=usuario_existente');

    const medico = result.rows[0];
    const valido = await bcrypt.compare(password, medico.password);
    if (!valido) return res.redirect('/inicio?error=error');

    req.session.usuario = {
      id: medico.id,
      nombre: medico.nombre,
      rol: 'doctor'
    };

    res.redirect('/inicio');
  } catch (err) {
    console.error("Error en login staff:", err);
    res.redirect('/inicio?error=error');
  }
});

// Login del Paciente
app.post('/login/paciente', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM pacientes WHERE email = $1', [email]);
    if (!result.rowCount) return res.redirect('/inicio?error=no_encontrado');

    const paciente = result.rows[0];
    const valido = await bcrypt.compare(password, paciente.password);
    if (!valido) return res.redirect('/inicio?error=error');

    req.session.usuario = {
      id: paciente.id,
      nombre: paciente.nombre,
      rol: 'paciente'
    };

    res.redirect('/turno');
  } catch (err) {
    console.error('Error en login paciente:', err);
    res.redirect('/inicio?error=error');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/inicio'));
});

// Turno de Paciente
app.get("/turno", async (req, res) => {
  let pacienteSeleccionado = null;

  if (req.session.usuario && req.session.usuario.rol === 'paciente') {
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [req.session.usuario.id]);
    pacienteSeleccionado = result.rows[0];
  }

  res.render("admisiones/turno", { pacienteSeleccionado });
});

// Mostrar pacientes y emergencias
// Mostrar pacientes y emergencias
app.get("/pacientes", async (req, res) => {
  try {
    const { rows: pacientes } = await pool.query(`
      SELECT p.id, p.nombre, p.telefono,
             m.nombre AS medico_derivante,
             COALESCE(
               (SELECT motivo FROM internaciones WHERE paciente_id = p.id AND fecha_egreso IS NULL ORDER BY fecha_ingreso DESC LIMIT 1),
               (SELECT motivo_derivacion FROM derivaciones WHERE paciente_id = p.id ORDER BY creado_en DESC LIMIT 1),
               (SELECT motivo_turno FROM turnos WHERE paciente_id = p.id ORDER BY fecha DESC LIMIT 1)
             ) AS motivo,
             c.id AS cama_id,
             h.nombre AS habitacion,
             a.nombre AS ala
      FROM pacientes p
      LEFT JOIN derivaciones d ON d.paciente_id = p.id
      LEFT JOIN medicos m ON m.id = d.medico_id
      LEFT JOIN camas c ON c.paciente_id = p.id
      LEFT JOIN habitaciones h ON h.id = c.habitacion_id
      LEFT JOIN alas a ON a.id = h.ala_id
      GROUP BY p.id, m.nombre, c.id, h.nombre, a.nombre
      ORDER BY p.id;
    `);

    const { rows: emergencias } = await pool.query(`
      SELECT sexo, motivo, cama_id
      FROM emergencias
      ORDER BY id DESC
      LIMIT 10;
    `);

    res.render("pacientes/index", {
      pacientes,
      emergencias,
      showSidebar: false,
      success: req.query.success
    });
  } catch (err) {
    console.error("Error en GET /pacientes:", err);
    res.status(500).send("Error al cargar pacientes");
  }
});

// Editar paciente
app.get("/pacientes/:id/editar", async (req, res) => {
  try {
    const { id } = req.params;

    const pacienteQuery = await pool.query(`
      SELECT p.*, d.medico_id, d.motivo_derivacion,
             m.nombre AS medico_derivante, 
             a.nombre AS ala, h.nombre AS habitacion, c.id AS cama_id
      FROM pacientes p
      LEFT JOIN derivaciones d ON d.paciente_id = p.id
      LEFT JOIN medicos m ON m.id = d.medico_id
      LEFT JOIN camas c ON c.paciente_id = p.id
      LEFT JOIN habitaciones h ON h.id = c.habitacion_id
      LEFT JOIN alas a ON a.id = h.ala_id
      WHERE p.id = $1 LIMIT 1;
    `, [id]);

    const medicosQuery = await pool.query("SELECT id, nombre FROM medicos ORDER BY nombre");

    res.render("pacientes/formulario", {
      paciente: pacienteQuery.rows[0],
      medicos: medicosQuery.rows
    });
  } catch (err) {
    console.error("Error en GET editar paciente:", err);
    res.status(500).send("Error al cargar datos del paciente");
  }
});

// Actualizar paciente y derivación
app.post("/pacientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, medico_id } = req.body;

  try {
    await pool.query(
      "UPDATE pacientes SET nombre = $1, telefono = $2 WHERE id = $3",
      [nombre, telefono, id]
    );

    const derivacionExistente = await pool.query(
      "SELECT 1 FROM derivaciones WHERE paciente_id = $1",
      [id]
    );

    if (medico_id) {
      if (derivacionExistente.rowCount) {
        await pool.query(
          "UPDATE derivaciones SET medico_id = $1 WHERE paciente_id = $2",
          [medico_id, id]
        );
      } else {
        await pool.query(
          "INSERT INTO derivaciones (paciente_id, medico_id, creado_en) VALUES ($1, $2, NOW())",
          [id, medico_id]
        );
      }
    }

    res.redirect("/pacientes?success=1");
  } catch (err) {
    console.error("Error al actualizar paciente:", err);
    res.status(500).send("Error al actualizar paciente");
  }
});

// Eliminar paciente
app.post("/pacientes/:id/eliminar", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM pacientes WHERE id = $1", [id]);
    res.redirect("/pacientes");
  } catch (err) {
    console.error("Error al eliminar paciente:", err);
    res.status(500).send("Error al eliminar paciente");
  }
});

// Admisiones (solo médicos)
app.get("/admisiones", (req, res) => {
  if (!req.session.usuario || req.session.usuario.rol !== 'doctor') {
    return res.redirect('/inicio?error=acceso_denegado');
  }
  res.render("admisiones/formulario");
});

app.post("/admisiones", async (req, res) => {
  const {
    nombre,
    direccion,
    telefono,
    contacto_emergencia,
    fecha_nacimiento,
    obra_social,
    sexo,
    dni,
    tipo_sangre,
    motivo
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO pacientes (nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo, dni, tipo_sangre)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `, [nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo, dni, tipo_sangre]);

    const pacienteId = result.rows[0].id;

    //Guardar el motivo como derivación genérica
    await pool.query(`
      INSERT INTO derivaciones (paciente_id, motivo_derivacion, creado_en)
      VALUES ($1, $2, NOW())
    `, [pacienteId, motivo]);

    res.redirect("/inicio?success=admitido");
  } catch (error) {
    console.error("Error al registrar admisión:", error);
    res.status(500).send("Error al registrar paciente admitido.");
  }
});



//  Procesar motivo de ingreso
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

app.post("/turno-nuevo", async (req, res) => {
  const {
    paciente_id, nombre, direccion, telefono,
    contacto_emergencia, fecha_nacimiento, obra_social,
    sexo, motivo_turno, dni, tipo_sangre
  } = req.body;

  try {
    let pacienteId = paciente_id;

    // Si no hay paciente_id, buscar por DNI o crear nuevo
    if (!pacienteId) {
      const existente = await pool.query(`SELECT id FROM pacientes WHERE dni = $1`, [dni]);
      if (existente.rowCount > 0) {
        pacienteId = existente.rows[0].id;
      } else {
        const insert = await pool.query(
          `INSERT INTO pacientes (nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo, dni, tipo_sangre)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo, dni, tipo_sangre]
        );
        pacienteId = insert.rows[0].id;
      }
    }

    // Actualiza solo si le faltan datos críticos
    const existing = await pool.query(`SELECT dni, tipo_sangre FROM pacientes WHERE id = $1`, [pacienteId]);
    if (!existing.rows[0].dni || !existing.rows[0].tipo_sangre) {
      await pool.query(
        `UPDATE pacientes SET dni = COALESCE(dni, $1), tipo_sangre = COALESCE(tipo_sangre, $2) WHERE id = $3`,
        [dni, tipo_sangre, pacienteId]
      );
    }

    // 🔍 Buscar si ya tiene un turno activo
    const turnoExistente = await pool.query(`
      SELECT id, motivo_turno
      FROM turnos
      WHERE paciente_id = $1
      ORDER BY fecha DESC
      LIMIT 1
    `, [pacienteId]);

    if (turnoExistente.rowCount > 0) {
      const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [pacienteId]);
      const pacienteSeleccionado = result.rows[0];

      return res.render("admisiones/turno-confirmar", {
        pacienteSeleccionado,
        turnoAnterior: turnoExistente.rows[0],
        nuevoMotivo: motivo_turno,
        formData: req.body
      });
    }

    // 🟢 Si no hay turno activo, insertar uno nuevo
    await pool.query(
      `INSERT INTO turnos (paciente_id, motivo_turno, fecha) VALUES ($1, $2, NOW())`,
      [pacienteId, motivo_turno]
    );

    res.redirect("/inicio?success=turno");
  } catch (error) {
    console.error("Error al registrar turno:", error);
    res.status(500).send("Error al registrar el turno");
  }
});

//manejando el turno de reemplazo
app.post("/turno-reemplazar", async (req, res) => {
  const {
    paciente_id, nombre, direccion, telefono,
    contacto_emergencia, fecha_nacimiento, obra_social,
    sexo, motivo_turno, dni, tipo_sangre
  } = req.body;

  try {
    const pacienteId = paciente_id;

    // Reemplazar significa agregar nuevo turno (sin borrar el anterior)
    await pool.query(
      `INSERT INTO turnos (paciente_id, motivo_turno, fecha) VALUES ($1, $2, NOW())`,
      [pacienteId, motivo_turno]
    );

    res.redirect("/inicio?success=turno_reemplazado");
  } catch (error) {
    console.error("Error al reemplazar turno:", error);
    res.status(500).send("Error al reemplazar el turno");
  }
});

//post de turno confirmado
app.post("/turno-confirmado", async (req, res) => {
  const {
    paciente_id, motivo_turno
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO turnos (paciente_id, motivo_turno, fecha) VALUES ($1, $2, NOW())`,
      [paciente_id, motivo_turno]
    );

    res.redirect("/inicio?success=turno_reemplazado");
  } catch (error) {
    console.error("Error al confirmar turno:", error);
    res.status(500).send("Error al confirmar el turno");
  }
});



//Derivación médica 
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
    console.error("ERROR en /derivacion:", err);
    res.status(500).send("Error al cargar datos");
  }
});

app.post('/derivacion-nuevo', async (req, res) => {
  const { paciente_id, medico_id, motivo_derivacion, especialidad_derivacion } = req.body;

  try {
    // Verificamos si ya existe una derivación para este paciente
    const existente = await pool.query(`
      SELECT id FROM derivaciones WHERE paciente_id = $1
    `, [paciente_id]);

    if (existente.rowCount > 0) {
      // Actualizar derivación existente
      await pool.query(`
        UPDATE derivaciones 
        SET medico_id = $1, motivo_derivacion = $2, especialidad_derivacion = $3, creado_en = NOW()
        WHERE paciente_id = $4
      `, [medico_id, motivo_derivacion, especialidad_derivacion, paciente_id]);
    } else {
      // Crear nueva derivación
      await pool.query(`
        INSERT INTO derivaciones (paciente_id, medico_id, motivo_derivacion, especialidad_derivacion, creado_en)
        VALUES ($1, $2, $3, $4, NOW())
      `, [paciente_id, medico_id, motivo_derivacion, especialidad_derivacion]);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error al registrar derivación:', err);
    res.status(500).send('Error al registrar derivación');
  }
});



//Habitaciones y camas

//funcion para calcular edad
function calcularEdad(fecha) {
  const f = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - f.getFullYear();
  if (hoy.getMonth() < f.getMonth() || (hoy.getMonth() === f.getMonth() && hoy.getDate() < f.getDate())) {
    edad--;
  }
  return edad;
}

//Listar habitaciones, camas y pacientes disponibles
app.get("/habitaciones", async (req, res) => {
  const result = await pool.query(`
    SELECT a.id AS ala_id, a.nombre AS ala,
           h.id AS hab_id, h.nombre AS habitacion,
           c.id AS cama_id, c.estado, c.sexo,
           p.id AS paciente_id, p.nombre AS paciente_nombre, p.dni, p.tipo_sangre, p.sexo AS paciente_sexo,
           p.fecha_nacimiento, d.motivo_derivacion, t.motivo_turno
    FROM alas a
    LEFT JOIN habitaciones h ON h.ala_id = a.id
    LEFT JOIN camas c ON c.habitacion_id = h.id
    LEFT JOIN pacientes p ON p.id = c.paciente_id
    LEFT JOIN derivaciones d ON d.paciente_id = p.id
    LEFT JOIN turnos t ON t.paciente_id = p.id
    ORDER BY a.id, h.id, c.id
  `);

  const data = {};
  const camas = [];

  result.rows.forEach(r => {
    if (!data[r.ala_id]) data[r.ala_id] = { nombre: r.ala, habitaciones: {} };

    if (r.hab_id) {
      const ala = data[r.ala_id];
      if (!ala.habitaciones[r.hab_id]) {
        ala.habitaciones[r.hab_id] = { nombre: r.habitacion, camas: [] };
      }

      const paciente = r.paciente_id ? {
        id: r.paciente_id,
        nombre: r.paciente_nombre,
        dni: r.dni,
        tipo_sangre: r.tipo_sangre,
        sexo: r.paciente_sexo,
        edad: r.fecha_nacimiento ? calcularEdad(r.fecha_nacimiento) : '-',
        motivo: r.motivo_derivacion || r.motivo_turno || 'Emergencia'
      } : null;

      const cama = {
        id: r.cama_id,
        estado: r.estado,
        sexo: r.sexo,
        paciente
      };

      // Agregar al array global camas[] solo si no existe
        const yaExisteEnCamas = camas.some(c => c.id === r.cama_id);
        if (!yaExisteEnCamas) {
        camas.push(cama);
        }

        // Agregar al array de la habitación solo si no existe
        const camasHabitacion = ala.habitaciones[r.hab_id].camas;
        const yaExisteEnHabitacion = camasHabitacion.some(c => c.id === r.cama_id);
        if (!yaExisteEnHabitacion) {
        camasHabitacion.push(cama);
        }
    }
  });

  const pacientes_disponibles = (await pool.query(`
    SELECT id, nombre, dni, tipo_sangre, sexo, fecha_nacimiento,
      (SELECT motivo_derivacion FROM derivaciones WHERE paciente_id = pacientes.id ORDER BY creado_en DESC LIMIT 1) as motivo_derivacion
    FROM pacientes
    WHERE id NOT IN (SELECT paciente_id FROM camas WHERE paciente_id IS NOT NULL)
    ORDER BY nombre
  `)).rows;

  res.render("habitaciones/index", {
    alas: Object.entries(data).map(([id, a]) => ({
      id,
      nombre: a.nombre,
      habitaciones: Object.entries(a.habitaciones).map(([hid, h]) => ({
        id: hid,
        nombre: h.nombre,
        camas: h.camas
      })),
    })),
    camas,
    pacientes_disponibles,
    showSidebar: true,
    success: req.query.success,
    error: req.query.error
  });
});

// Crear habitacion

app.post('/habitaciones', async (req, res) => {
  const { ala_id, nombre } = req.body;
  try {
    await pool.query(
      'INSERT INTO habitaciones (ala_id, nombre) VALUES ($1, $2)',
      [ala_id, nombre]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error("Error al crear habitación:", error);
    res.sendStatus(500);
  }
});

// Crear cama
app.post("/camas", async (req, res) => {
  const { habitacion_id } = req.body;

  try {
    const { rows } = await pool.query(`
      SELECT a.nombre AS ala, c.sexo
      FROM habitaciones h
      JOIN alas a ON a.id = h.ala_id
      LEFT JOIN camas c ON c.habitacion_id = h.id
      WHERE h.id = $1
    `, [habitacion_id]);

    const alaNombre = rows[0]?.ala || "";
    const sexos = rows.map(r => r.sexo).filter(s => s);
    const cantidadCamas = rows.length;
    const esEmergencia = alaNombre.toLowerCase().includes("emergencia");
    const sexoUnico = new Set(sexos);

    if (!esEmergencia && sexoUnico.size > 1) {
      return res.status(409).send("No se pueden mezclar sexos en una habitación no emergente.");
    }

    if (!esEmergencia && cantidadCamas >= 2) {
      return res.status(409).send("No se pueden agregar más de 2 camas en esta habitación.");
    }

    if (esEmergencia && cantidadCamas >= 6) {
      return res.status(409).send("Máximo 6 camas en sala de emergencia.");
    }

    await pool.query(
      `INSERT INTO camas (habitacion_id, estado) VALUES ($1, 'libre_higienizada')`,
      [habitacion_id]
    );

    res.sendStatus(201);
  } catch (error) {
    console.error("Error al agregar cama:", error);
    res.sendStatus(500);
  }
});

//Editar cama
app.post('/camas/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { estado, sexo, paciente_id } = req.body;

  try {
    const { rows } = await pool.query(`
      SELECT h.id AS habitacion_id, a.nombre AS ala
      FROM camas c
      JOIN habitaciones h ON h.id = c.habitacion_id
      JOIN alas a ON a.id = h.ala_id
      WHERE c.id = $1
    `, [id]);

    const habitacion_id = rows[0].habitacion_id;
    const alaNombre = rows[0].ala;

    const camas = await pool.query(`
      SELECT sexo FROM camas WHERE habitacion_id = $1 AND id != $2 AND sexo IS NOT NULL
    `, [habitacion_id, id]);

    const sexos = camas.rows.map(c => c.sexo);
    const sexoUnico = new Set(sexos);
    const esEmergencia = alaNombre.toLowerCase().includes("emergencia");

    if (!esEmergencia && sexo && sexoUnico.size && !sexoUnico.has(sexo)) {
      return res.redirect(req.get('Referer') + '?error=sexo_mixto');
    }

    // ✅ Solo liberar paciente si se marca como libre
    if (estado === 'libre_higienizada') {
      await pool.query(
        `UPDATE camas SET estado = $1, sexo = $2, paciente_id = NULL WHERE id = $3`,
        [estado, sexo || null, id]
      );
    } else {
      await pool.query(
        `UPDATE camas SET estado = $1, sexo = $2, paciente_id = COALESCE($3, paciente_id) WHERE id = $4`,
        [estado, sexo || null, paciente_id || null, id]
      );
    }

    res.redirect('/habitaciones');
  } catch (err) {
    console.error("Error al editar cama:", err);
    res.redirect('/habitaciones?error=fallo_edit');
  }
});


// Eliminar cama
app.post('/camas/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM camas WHERE id = $1`, [id]);
    res.redirect('/habitaciones');
  } catch (err) {
    console.error("Error al eliminar cama:", err);
    res.redirect('/habitaciones?error=fallo_delete');
  }
});

// Mostrar lista de alas
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

// Crear nueva ala
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

//editar ala
app.post("/alas/:id/edit", async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    await pool.query("UPDATE alas SET nombre = $1 WHERE id = $2", [nombre, id]);
    res.redirect("/alas?success=ala_modificada");
  } catch (err) {
    console.error("ERROR en POST /alas/:id/edit:", err);
    res.redirect("/alas?error=No se pudo modificar el ala");
  }
});
// Eliminar ala
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

//Emergencias
app.get('/emergencia', (req, res) => {
  res.render('admisiones/emergencia');
});

// Procesar formulario de emergencia
app.post('/emergencia/asignar', async (req, res) => {
  const { motivo, sexo } = req.body;

  try {
    // Buscar cama libre e higienizada en Emergencias del mismo sexo (o sin sexo asignado)
    const result = await pool.query(`
      SELECT camas.id
      FROM camas
      JOIN habitaciones ON habitaciones.id = camas.habitacion_id
      JOIN alas ON alas.id = habitaciones.ala_id
      WHERE alas.nombre ILIKE 'Emergencias'
        AND camas.estado = 'libre_higienizada'
        AND (camas.sexo IS NULL OR camas.sexo = $1)
      LIMIT 1
    `, [sexo]);

    // Si no hay cama disponible, mostrar mensaje
    if (result.rows.length === 0) {
      return res.send('No hay camas de emergencia disponibles.');
    }

    const camaId = result.rows[0].id;

    // Registrar emergencia
    await pool.query(`
      INSERT INTO emergencias (motivo, sexo, cama_id)
      VALUES ($1, $2, $3)
    `, [motivo, sexo, camaId]);

    // Actualizar estado de la cama
    await pool.query(`
      UPDATE camas SET estado = 'ocupada', sexo = $1 WHERE id = $2
    `, [sexo, camaId]);

    res.redirect('/habitaciones?emergencia_ok=1');
  } catch (err) {
    console.error("Error al registrar emergencia:", err);
    res.status(500).send("Error al asignar cama de emergencia.");
  }
});

//API Pacientes con internación activa por ala
app.get("/api/pacientes-con-turno", async (req, res) => {
  const { ala } = req.query;

  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.nombre, p.dni
      FROM internaciones i
      JOIN pacientes p ON p.id = i.paciente_id
      JOIN habitaciones h ON h.id = i.habitacion_id
      JOIN alas a ON a.id = h.ala_id
      WHERE a.nombre = $1
        AND i.fecha_egreso IS NULL
      ORDER BY p.nombre
    `, [ala]);

    res.json(rows);
  } catch (err) {
    console.error("Error en /api/pacientes-con-turno:", err);
    res.status(500).json([]);
  }
});

//INIcio del servidor
const PUERTO = process.env.PUERTO || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
