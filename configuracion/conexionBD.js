const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, require: true
  }
});

pool.connect()
.then(client => {
console.log('Conexión exitosa a Neon');
client.release();
})
.catch(err => {
console.error('Error de conexión a Neon', err);
});

module.exports = pool;

