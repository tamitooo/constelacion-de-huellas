/**
 * routes/huellas.routes.js
 * --------------------------------------------------------
 * Define las rutas REST relacionadas con las huellas y la
 * constelación, delegando la lógica al controlador.
 * --------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const {
  crearHuella,
  obtenerHuellas,
  obtenerConstelacion,
} = require('../controllers/huellas.controller');

// POST /api/huellas -> Registrar una nueva huella
router.post('/huellas', crearHuella);

// GET /api/huellas -> Obtener todas las huellas
router.get('/huellas', obtenerHuellas);

// GET /api/constelacion -> Obtener nodos y enlaces para la constelación
router.get('/constelacion', obtenerConstelacion);

module.exports = router;
