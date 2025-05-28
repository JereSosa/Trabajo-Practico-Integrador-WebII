// app.js

const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware para procesar formularios x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde /publico
app.use(express.static(path.join(__dirname, "publico")));

// Configuración de PUG
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "vistas"));

/**
 * Página de inicio: botones “Sacar turno”, “Derivación Médica” y “Emergencia”
 */
app.get("/inicio", (req, res) => {
  res.render("inicio/index");
});

/**
 * Procesa la elección de ingreso
 * - emergencia → /admisiones?emergencia=true
 * - cita (“Sacar turno”) → /turno
 * - derivación → /derivacion
 */
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

/**
 * Formulario de admisión (“Emergencia” o ingreso normal)
 */
app.get("/", (req, res) => {
  res.render("admisiones/formulario");
});
app.post("/admisiones", (req, res) => {
  console.log("Datos recibidos en /admisiones:", req.body);
  // Aquí más adelante guardarías en la base de datos...
  res.redirect("/inicio");
});

/**
 * Vista “Sacar turno”
 */
app.get("/turno", (req, res) => {
  res.render("admisiones/turno");
});

/**
 * Vista “Derivación Médica”
 */
app.get("/derivacion", (req, res) => {
  res.render("admisiones/derivacion");
});

/**
 * Levantar servidor
 */
const PUERTO = process.env.PUERTO || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
