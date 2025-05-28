// app.js
const express = require("express");
const path = require("path");
require("dotenv").config();

const pool = require("./configuracion/conexionBD");
const app = express();

// → Forzar cabecera UTF-8
app.use((req, res, next) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "publico")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "vistas"));

// Página de inicio
app.get("/inicio", (req, res) => {
  res.render("inicio/index");
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

const PUERTO = process.env.PUERTO || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
