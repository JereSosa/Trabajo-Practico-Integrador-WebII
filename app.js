const express = require('express');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'vistas'));

app.use(express.static(path.join(__dirname, 'publico')));

// ✅ RUTA DE INICIO
app.get('/inicio', (req, res) => {
  res.render('inicio/index');
});

// ✅ PROCESO DEL MOTIVO DE INGRESO
app.post('/proceso-ingreso', (req, res) => {
  const { motivo } = req.body;

  switch (motivo) {
    case 'emergencia':
      return res.redirect('/admisiones?emergencia=true');
    case 'derivacion':
    case 'cita':
      return res.redirect('/');
    default:
      return res.redirect('/inicio');
  }
});

// ✅ FORMULARIO NORMAL DE ADMISIÓN
app.get('/', (req, res) => {
  res.render('admisiones/formulario');
});

app.post('/admisiones', (req, res) => {
  console.log('Datos recibidos del formulario:');
  console.log(req.body);
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});