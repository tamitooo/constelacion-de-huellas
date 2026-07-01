/**
 * ============================================================
 *  config.js
 * ============================================================
 *  Única fuente de verdad para constantes y "números mágicos"
 *  del frontend. Ningún otro archivo debería hardcodear estos
 *  valores por su cuenta: si hay que ajustar el balance visual
 *  o el comportamiento de las conexiones, se hace acá.
 *
 *  Contenido:
 *  ------------------------------------------------------------
 *  - API_BASE / FETCH_TIMEOUT_MS: dónde vive el backend y cuánto
 *    esperar antes de darlo por caído.
 *  - CONEXION: parámetros del algoritmo que decide qué estrellas
 *    se conectan entre sí (ver frontend/conexiones.js).
 *  - COLOR_EMOCION: color hex por emoción — debe coincidir 1:1
 *    con COLORES_POR_EMOCION del backend (huellas.controller.js),
 *    ya que ambos representan la misma paleta de diseño.
 *  - VIEWPORT_*: dimensiones del "universo" (#universo-viewport
 *    en index.html/style.css) y su centro, usados para que las
 *    conexiones repliquen el mismo transform-origin de la cámara.
 *  - ZONA_OFFSET: desplazamiento (dx, dy) desde el centro de la
 *    pantalla para cada categoría, así las estrellas de un mismo
 *    tema aparecen agrupadas en un "cuadrante" propio.
 *  - DISPERSION: qué tan esparcidas quedan las estrellas dentro
 *    de su zona.
 *  - TIEMPOS: duración (ms) de cada etapa del flujo de envío de
 *    una huella (usadas por ui.js).
 * ============================================================
 */

// URL base del backend (Express). Cambiar acá si el backend se
// despliega en otro host/puerto.
export const API_BASE = 'http://localhost:4000/api';

// Tiempo máximo de espera para cualquier petición al backend antes
// de abortarla (ver fetchConTimeout en api.js).
export const FETCH_TIMEOUT_MS = 15000;

// Parámetros del algoritmo de conexiones (ver conexiones.js):
// cada criterio suma puntos y solo se dibuja una línea si el
// puntaje total supera SCORE_MINIMO.
export const CONEXION = {
  SCORE_MINIMO: 3,             // umbral mínimo para considerar una conexión válida
  SCORE_CATEGORIA: 2,          // puntos si ambas huellas comparten categoría
  SCORE_EMOCION: 2,            // puntos si ambas huellas comparten emoción
  SCORE_PALABRAS_CLAVE: 2,     // puntos si comparten suficientes palabras clave
  SCORE_DISTANCIA: 1,          // puntos si están físicamente cerca en el lienzo
  DIST_MAX: 280,               // distancia (px) por debajo de la cual se otorga SCORE_DISTANCIA
  MIN_PALABRAS_COMPARTIDAS: 2, // mínimo de palabras clave en común para sumar puntos
  MAX_POR_ESTRELLA: 3,         // límite de conexiones por estrella (evita un "nudo" visual)
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

// Dimensiones del #universo-viewport (ver style.css). El "universo"
// es un lienzo grande (4000x4000) sobre el que se posicionan las
// estrellas; la cámara (camera.js) hace pan/zoom sobre él.
export const VIEWPORT_W = 4000;
export const VIEWPORT_H = 4000;
export const VIEWPORT_CENTRO_X = VIEWPORT_W / 2;
export const VIEWPORT_CENTRO_Y = VIEWPORT_H / 2;

// Las claves deben coincidir EXACTAMENTE con las categorías que devuelve
// el backend (documento de diseño, sección 2). Cada categoría "empuja"
// sus estrellas hacia un cuadrante distinto del centro de pantalla.
export const ZONA_OFFSET = {
  'Familia y Raíces':              { dx:   0, dy: -180 }, // Norte
  'Amistad y Complicidad':         { dx: 200, dy:  -80 }, // Noreste
  'Amor y Desamor':                { dx: 180, dy:  150 }, // Sureste
  'Aprendizaje y Transformación':  { dx: -180, dy:  150 }, // Suroeste
  'Pérdida y Ausencia':            { dx: -200, dy:  -80 }, // Noroeste
};

// Radio de dispersión aleatoria (px) alrededor del offset de zona,
// usado por posicionPorCategoria() en estrellas.js.
export const DISPERSION = 160;

// ── Tiempos del flujo de envío (ms) ────────────────────────────
// Controlan el ritmo narrativo de la experiencia al enviar una
// huella nueva (usados en ui.js, no incluido en este set de archivos).
export const TIEMPOS = {
  SUSPENSO_COLORES:     2000, // pausa "pensando" antes de revelar la clasificación
  MENSAJE_CONVERSION:   3000, // tiempo mostrando el mensaje de transformación en estrella
  MOSTRAR_RESULTADO:    6000, // tiempo total mostrando categoría/emoción resultantes
  PARPADEO_ERROR_INPUT: 1200, // duración del feedback visual de error en el input
  OCULTAR_GUIA:         8000, // tiempo antes de desvanecer el texto de ayuda de exploración
};
