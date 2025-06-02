# Trabajo-Practico-Integrador-WebII
Este proyecto es una aplicación web completa desarrollada para la gestión de internaciones hospitalarias. Permite administrar pacientes, médicos, camas, habitaciones, derivaciones y emergencias, todo desde una interfaz moderna y funcional.


Tecnologías que use: 
Node.js - entorno de ejecución del backend.
Express - framework web ligero para el servidor.
Pug - motor de plantillas usado para renderizar vistas en el servidor.
Tailwind CSS - framework CSS utility-first para diseño moderno y responsive.
PostgreSQL - base de datos relacional.
pg - cliente de PostgreSQL para Node.js.
bcryptjs - encriptación segura de contraseñas.
express-session - manejo de sesiones de usuario.
dotenv - configuración de variables de entorno.

Que puedo hacer en este proyecto? Registro e inicio de sesión para pacientes y personal médico.
Gestión de pacientes: turnos, derivaciones, internaciones y emergencias.
Administración visual de alas, habitaciones y camas.
Asignación de pacientes a camas con validaciones por sexo, estado de cama y tipo de sala.
Alta y baja de habitaciones, camas y pacientes.
Formularios conectados, datos prellenados, y vistas renderizadas en Pug.

Para este proyecto se necesita
RequisitosNode.js
PostgreSQL

Instalación y configuración

crear un archivo .env con los datos: 
'DATABASE_URL=postgres://usuario:contraseña@localhost:5432/his_db
CODIGO_REGISTRO_STAFF=SOYMEDICO2024
PUERTO=3000'

Crear la base de datos con postgre
Como lo hice yo: 1) haber instalado postgreSQL
2) crear una terminal de bash en vscode
3) usar el siguiente comando para la creacion de base de datos y funcionamiento de la aplicacion:
A) psql -U postgres -d his_db -f respaldo/hospital.sql
B) te deberia preguntrar tu contraseña de postgres y cargarte la base de datos

una vez terminado en una nueva terminal bash ejecutar el comando:
node app.js y entrar a la primera pagina http://localhost:3000/inicio