/**
 * server.js
 * --------------------------------------------------------
 * Punto de entrada del backend "Constelación de Huellas".
 * Configura Express, middlewares globales, rutas y el
 * manejo centralizado de errores.
 * --------------------------------------------------------
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const huellasRoutes = require('./routes/huellas.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// --------------------------------------------------------
// Middlewares globales
// --------------------------------------------------------

// Habilita CORS para permitir peticiones desde el frontend (React + Vite)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);

// Permite parsear el body de las peticiones en formato JSON
app.use(express.json());

// --------------------------------------------------------
// Rutas
// --------------------------------------------------------

// Ruta de salud / verificación rápida del servidor
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: '✨ API de Constelación de Huellas funcionando correctamente.',
  });
});

// Todas las rutas de huellas y constelación bajo el prefijo /api
app.use('/api', huellasRoutes);

// --------------------------------------------------------
// Manejo de rutas no encontradas (404)
// --------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------------
// Middleware centralizado de manejo de errores
// --------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('❌ Error no controlado:', err.stack);
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
  });
});

// --------------------------------------------------------
// Inicio del servidor
// --------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
