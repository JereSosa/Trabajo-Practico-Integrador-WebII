const express = require('express');
const path = require('path');

const app = express(); // ← Esto tiene que estar antes de cualquier "app.use"

// Middleware para procesar datos del formulario
app.use(express.urlencoded({ extended: true }));

// Motor de plantillas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'vistas'));

// Archivos estáticos (como CSS)
app.use(express.static(path.join(__dirname, 'publico')));

// Ruta para mostrar el formulario
app.get('/', (req, res) => {
  res.render('admisiones/formulario');
});

// Ruta para recibir el formulario
app.post('/admisiones', (req, res) => {
  console.log('Datos recibidos del formulario:');
  console.log(req.body);
  res.redirect('/');
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});