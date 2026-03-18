require('dotenv').config();
const mysql = require('mysql2/promise');

async function prepararBaseDeDatos() {
  try {
    const conexion = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log("⏳ Conectando a Aiven...");

    await conexion.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabla 'usuarios' creada con éxito.");

    try {
      await conexion.query(`ALTER TABLE movimientos ADD COLUMN usuario_id INT;`);
      console.log("✅ Columna 'usuario_id' agregada a tus movimientos.");
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("⚡ La columna 'usuario_id' ya estaba lista.");
      } else {
        throw error;
      }
    }

    console.log("🎉 ¡Bóveda lista! Ya puedes cerrar este archivo.");
    conexion.end();

  } catch (error) {
    console.error("❌ Error al preparar la base de datos:", error);
  }
}

prepararBaseDeDatos();