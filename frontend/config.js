// config.js
export const API_BASE = 'http://localhost:4000/api';

export const FETCH_TIMEOUT_MS = 15000;

export const CONEXION = {
  SCORE_MINIMO: 3,
  SCORE_CATEGORIA: 2,
  SCORE_EMOCION: 2,
  SCORE_PALABRAS_CLAVE: 2,
  SCORE_DISTANCIA: 1,
  DIST_MAX: 280,
  MIN_PALABRAS_COMPARTIDAS: 2,
  MAX_POR_ESTRELLA: 3,
};

// Sincronizado con el documento de diseño (sección 3) y con
// COLORES_POR_EMOCION del backend (huellas.controller.js).
// Tristeza y Nostalgia comparten el mismo azul profundo;
// Empatía y Gratitud comparten el mismo turquesa;
// Resiliencia y Transformación comparten el mismo violeta.
export const COLOR_EMOCION = {
  'Amor':           '#BC587B',  // Rosa Eléctrico / Magenta
  'Alegría':        '#ffedab',  // Dorado / Amarillo cálido
  'Empatía':        '#00CED1',  // Verde Esmeralda / Turquesa
  'Gratitud':       '#00CED1',  // Verde Esmeralda / Turquesa
  'Tristeza':       '#3A4FC5',  // Azul Profundo / Índigo
  'Nostalgia':      '#3A4FC5',  // Azul Profundo / Índigo
  'Resiliencia':    '#9297FE',  // Violeta / Morado
  'Transformación': '#9297FE',  // Violeta / Morado
  'Ira':            '#DC143C',  // Rojo Vivo / Carmesí
  'Neutral':        '#FFFFFF',  // Blanco
};

// Dimensiones del #universo-viewport (ver style.css).
export const VIEWPORT_W = 4000;
export const VIEWPORT_H = 4000;
export const VIEWPORT_CENTRO_X = VIEWPORT_W / 2;
export const VIEWPORT_CENTRO_Y = VIEWPORT_H / 2;

// Las claves deben coincidir EXACTAMENTE con las categorías que devuelve
// el backend (documento de diseño, sección 2).
export const ZONA_OFFSET = {
  'Familia y Raíces':              { dx:   0, dy: -180 },
  'Amistad y Complicidad':         { dx: 200, dy:  -80 },
  'Amor y Desamor':                { dx: 180, dy:  150 },
  'Aprendizaje y Transformación':  { dx: -180, dy:  150 },
  'Pérdida y Ausencia':            { dx: -200, dy:  -80 },
};

export const DISPERSION = 160;

// ── Tiempos del flujo de envío (ms) ────────────────────────────
export const TIEMPOS = {
  SUSPENSO_COLORES:     2000,
  MENSAJE_CONVERSION:   3000,
  MOSTRAR_RESULTADO:    6000,
  PARPADEO_ERROR_INPUT: 1200,
  OCULTAR_GUIA:         8000,
};