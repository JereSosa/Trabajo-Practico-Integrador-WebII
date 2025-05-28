-- 1. Crear la base de datos
CREATE DATABASE his_db;

\connect his_db;

-- 2. Tabla pacientes
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200),
  telefono VARCHAR(30),
  contacto_emergencia VARCHAR(30),
  fecha_nacimiento DATE,
  obra_social VARCHAR(100),
  sexo CHAR(1) CHECK (sexo IN ('M','F')),
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Tabla turnos
CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  motivo_turno TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

-- 4. Tabla medicos
CREATE TABLE medicos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100)
);

-- 5. Tabla derivaciones
CREATE TABLE derivaciones (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id INTEGER NOT NULL REFERENCES medicos(id),
  motivo_derivacion TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

-- 6. Datos de ejemplo
INSERT INTO medicos (nombre, especialidad) VALUES
  ('Dr. Juan Pérez', 'Medicina General'),
  ('Dra. María López', 'Cardiología');

INSERT INTO pacientes (nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo)
VALUES
  ('Ana Gómez', 'Calle Falsa 123', '11-1234-5678', '11-8765-4321', '1980-05-15', 'PAMI', 'F'),
  ('Luis Martínez', 'Av. Siempre Viva 742', '11-2345-6789', '11-9876-5432', '1975-10-01', 'OSDE', 'M');

INSERT INTO turnos (paciente_id, motivo_turno) VALUES
  (1, 'Control de rutina'),
  (2, 'Dolor abdominal');

INSERT INTO derivaciones (paciente_id, medico_id, motivo_derivacion) VALUES
  (2, 1, 'Alta complejidad en cardiología');

-- 7. Nuevas tablas de alas, habitaciones y camas
CREATE TABLE alas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE habitaciones (
  id SERIAL PRIMARY KEY,
  ala_id INT NOT NULL REFERENCES alas(id) ON DELETE CASCADE,
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE camas (
  id             SERIAL PRIMARY KEY,
  habitacion_id  INT NOT NULL REFERENCES habitaciones(id) ON DELETE CASCADE,
  paciente_id    INT      REFERENCES pacientes(id),
  estado         VARCHAR(20) NOT NULL DEFAULT 'libre_higienizada'
    CHECK (estado IN (
      'libre_higienizada',
      'libre_sin_higienizar',
      'ocupada'
    )),
  sexo           CHAR(1)
);