// config.js
export const API_BASE = 'http://localhost:4000/api';

// Tiempo máximo (ms) que esperamos una respuesta del backend
// antes de cancelar la petición y mostrar el error de conexión.
export const FETCH_TIMEOUT_MS = 15000;

export const CONEXION = {
  SCORE_MINIMO: 3,
  SCORE_CATEGORIA: 3,
  SCORE_EMOCION: 2,
  SCORE_PALABRAS_CLAVE: 2,
  SCORE_DISTANCIA: 1,
  DIST_MAX: 280,
  MAX_POR_ESTRELLA: 4,
};

export const COLOR_EMOCION = {
  'Alegría': '#FFD700',
  'Nostalgia': '#7B68EE',
  'Tristeza': '#4A90D9',
  'Pasión': '#FF6B6B',
  'Gratitud': '#7CFC00',
  'Curiosidad': '#00BFFF',
};

// Offsets escalados ~1.4x respecto al original para que las zonas
// sigan separadas visualmente ahora que DISPERSION es mayor (280px).
// Sin este ajuste, zonas vecinas (ej. Familia y Amigos) terminaban
// solapándose y mezclando estrellas de categorías distintas.
export const ZONA_OFFSET = {
  'Familia': { dx: 0, dy: -310 },
  'Amigos': { dx: 320, dy: -110 },
  'Amor': { dx: 280, dy: 220 },
  'Estudios': { dx: -280, dy: 220 },
  'Crecimiento Personal': { dx: -310, dy: -110 },
};

// Lado (px) del área cuadrada donde se sortea la posición de cada
// estrella dentro de su zona de categoría. Se subió de 140 a 280:
// con estrellas grandes (~56px) y varias en la misma categoría,
// 140px dejaba muy poco margen y el algoritmo de anti-colisión
// fallaba tras sus 20 intentos, generando warnings en consola.
export const DISPERSION = 280;

// ── Tiempos del flujo de envío de una huella (ms) ──────────────
// Centralizados aquí para que ui.js no tenga números sueltos
// sin contexto y para poder ajustar el ritmo de la animación
// desde un solo lugar.
export const TIEMPOS = {
  // Cuánto se muestra el mensaje "se ha convertido en estrella"
  // antes de revelar la categoría/emoción.
  MENSAJE_CONVERSION: 2500,
  // Cuánto tiempo se deja la nueva estrella visible en la
  // constelación antes de ofrecer el botón "Volver".
  OBSERVAR_ESTRELLA: 6000,
  // Duración del parpadeo rojo cuando el campo está vacío.
  PARPADEO_ERROR_INPUT: 1200,
  // Cuánto tarda en ocultarse la guía de exploración tras volver
  // al formulario.
  OCULTAR_GUIA: 8000,
};