require('dotenv').config();
("La contraseña leída es:", process.env.DB_PASSWORD);
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Configuraciones de seguridad y formato
app.use(cors());
app.use(express.json()); 


// 1. Conexión a la base de datos MySQL en la NUBE (Aiven)
const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

conexion.connect((error) => {
  if (error) {
    console.error('❌ Error conectando a la Nube: ', error);
  } else {
    console.log('✅ ¡Conectado a la base de datos en AIVEN exitosamente!');
    
    // TRUCO DE MAGIA: Crear la tabla automáticamente si no existe en la nube
    const sqlCrearTabla = `
      CREATE TABLE IF NOT EXISTS movimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        descripcion VARCHAR(255) NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        tipo ENUM('gasto', 'ingreso') NOT NULL,
        cuenta VARCHAR(50) NOT NULL,
        es_para_otro BOOLEAN DEFAULT FALSE,
        deudor VARCHAR(100) NULL,
        en_cuotas BOOLEAN DEFAULT FALSE,
        cuota_actual INT NULL,
        cuotas_totales INT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    conexion.query(sqlCrearTabla, (err) => {
      if(err) {
        console.error("❌ Error creando la tabla:", err);
      } else {
        console.log("✅ Tabla 'movimientos' lista para usar en la nube.");
      }
    });
  }
});

// --- LAS RUTAS (EL PUENTE ENTRE REACT Y MYSQL) ---

// Ruta para LEER todos los movimientos (GET)
app.get('/api/movimientos', (req, res) => {
  const sql = "SELECT * FROM movimientos ORDER BY fecha_creacion DESC";
  conexion.query(sql, (error, resultados) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json(resultados);
  });
});

// Ruta para GUARDAR un nuevo movimiento (POST)
app.post('/api/movimientos', (req, res) => {
  const { descripcion, monto, tipo, cuenta, esParaOtro, deudor, enCuotas, cuotaActual, cuotasTotales } = req.body;
  
  // Convertimos textos vacíos a 'null' para que MySQL no dé error con los números
  const valorDeudor = deudor === '' ? null : deudor;
  const valorCuotaActual = cuotaActual === '' ? null : cuotaActual;
  const valorCuotasTotales = cuotasTotales === '' ? null : cuotasTotales;

  const sql = `INSERT INTO movimientos 
    (descripcion, monto, tipo, cuenta, es_para_otro, deudor, en_cuotas, cuota_actual, cuotas_totales) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
  const valores = [descripcion, monto, tipo, cuenta, esParaOtro, valorDeudor, enCuotas, valorCuotaActual, valorCuotasTotales];

  conexion.query(sql, valores, (error, resultado) => {
    if (error) {
      console.error("❌ Error en MySQL:", error.message); 
      return res.status(500).json({ error: error.message });
    }
    res.json({ mensaje: 'Movimiento guardado', id: resultado.insertId });
  });
});

// Ruta para ELIMINAR un movimiento (DELETE)
app.delete('/api/movimientos/:id', (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM movimientos WHERE id = ?";
  
  conexion.query(sql, [id], (error, resultado) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ mensaje: 'Movimiento eliminado correctamente' });
  });
});

// 2. Encender el servidor
// process.env.PORT es el puerto automático que nos dará la nube
const PUERTO = process.env.PORT || 3000; 
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PUERTO}`);
});