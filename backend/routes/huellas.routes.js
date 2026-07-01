/**
 * ============================================================
 *  routes/huellas.routes.js
 * ============================================================
 *  Define las rutas REST relacionadas con las huellas y la
 *  constelación. Este archivo NO contiene lógica de negocio:
 *  solo conecta cada endpoint HTTP con su función controladora
 *  correspondiente (patrón Router → Controller).
 *
 *  Endpoints expuestos (montados bajo el prefijo /api en server.js):
 *  ------------------------------------------------------------
 *  POST /api/huellas       -> Registrar una nueva huella
 *                              (texto -> Gemini la clasifica ->
 *                              se guarda y se devuelve completa).
 *  GET  /api/huellas       -> Obtener el listado crudo de todas
 *                              las huellas guardadas.
 *  GET  /api/constelacion  -> Obtener las huellas ya transformadas
 *                              en "nodes" (estrellas) + "links"
 *                              (conexiones calculadas entre ellas),
 *                              listo para que el frontend dibuje
 *                              la constelación.
 * ============================================================
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
