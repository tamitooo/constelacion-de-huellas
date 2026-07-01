/**
 * ============================================================
 *  conexiones.js
 * ============================================================
 *  Calcula y dibuja las líneas que conectan estrellas relacionadas
 *  entre sí dentro de la constelación, generando el "engine" de
 *  puntaje de similitud entre huellas.
 *
 *  Flujo general:
 *  ------------------------------------------------------------
 *  1. recalcularConexiones(estrellas) — se llama cada vez que se
 *     agrega o carga una estrella. Compara todas las parejas
 *     posibles y les da un puntaje según 4 criterios (ver
 *     CONEXION en config.js):
 *       - misma categoría
 *       - misma emoción
 *       - suficientes palabras clave compartidas
 *       - cercanía física en el lienzo
 *     Las parejas con puntaje >= SCORE_MINIMO son candidatas.
 *     Luego se seleccionan respetando un máximo de conexiones
 *     por estrella (MAX_POR_ESTRELLA), priorizando los puntajes
 *     más altos, para que ninguna estrella termine con demasiadas
 *     líneas y el resultado visual no se vuelva un enredo.
 *
 *  2. dibujarConexiones(ctx, capaConexiones, camera) — se llama en
 *     cada frame del loop de animación (main.js). Dibuja cada
 *     línea seleccionada como un degradado suave (más opaco al
 *     centro, transparente en los extremos), aplicando manualmente
 *     la misma transformación de cámara (pan + zoom) que el CSS
 *     le aplica a las estrellas — ver la nota grande dentro de la
 *     función aPantalla() sobre por qué esto es necesario.
 *
 *  Funciones de apoyo exportadas:
 *  ------------------------------------------------------------
 *  - getConexiones(): devuelve el array actual de conexiones.
 *  - palabrasCompartidas(a, b): cuenta cuántas palabras clave
 *    tienen en común dos huellas (comparación case-insensitive).
 *  - distancia(a, b): distancia euclidiana entre dos estrellas.
 * ============================================================
 */

import { CONEXION, VIEWPORT_CENTRO_X, VIEWPORT_CENTRO_Y } from './config.js';

// Estado interno: lista de conexiones actualmente activas.
let conexiones = [];

export function getConexiones() { return conexiones; }

/** Cuenta cuántas palabras clave comparten dos huellas (sin distinguir mayúsculas). */
export function palabrasCompartidas(a, b) {
  if (!a.palabrasClave.length || !b.palabrasClave.length) return 0;
  const setA = new Set(a.palabrasClave.map(p => p.toLowerCase()));
  return b.palabrasClave.filter(p => setA.has(p.toLowerCase())).length;
}

/** Distancia euclidiana simple entre dos estrellas (coordenadas x, y). */
export function distancia(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Recalcula el set completo de conexiones a partir del array de
 * estrellas actuales. Se ejecuta cada vez que cambia el número de
 * estrellas (nueva huella agregada, o carga inicial).
 */
export function recalcularConexiones(estrellas) {
  if (estrellas.length < 2) {
    conexiones = [];
    return;
  }

  // Paso 1: generar todas las parejas candidatas con puntaje suficiente.
  const candidatos = [];

  for (let i = 0; i < estrellas.length; i++) {
    for (let j = i + 1; j < estrellas.length; j++) {
      const a = estrellas[i];
      const b = estrellas[j];

      let score = 0;

      if (a.categoria === b.categoria) score += CONEXION.SCORE_CATEGORIA;
      if (a.emocion && b.emocion && a.emocion === b.emocion) score += CONEXION.SCORE_EMOCION;
      if (palabrasCompartidas(a, b) >= CONEXION.MIN_PALABRAS_COMPARTIDAS) score += CONEXION.SCORE_PALABRAS_CLAVE;
      if (distancia(a, b) < CONEXION.DIST_MAX) score += CONEXION.SCORE_DISTANCIA;

      if (score >= CONEXION.SCORE_MINIMO) {
        candidatos.push({ a, b, score });
      }
    }
  }

  // Paso 2: ordenar por puntaje descendente, para priorizar las
  // conexiones más "fuertes" al aplicar el límite por estrella.
  candidatos.sort((x, y) => y.score - x.score);

  // Paso 3: seleccionar conexiones respetando MAX_POR_ESTRELLA
  // (cuántas líneas puede tener como máximo cada estrella), para
  // que estrellas muy "conectadas" no saturen el dibujo.
  const gradosUsados = new Map();
  const seleccionadas = [];

  for (const c of candidatos) {
    const gradoA = gradosUsados.get(c.a.id) || 0;
    const gradoB = gradosUsados.get(c.b.id) || 0;

    if (gradoA < CONEXION.MAX_POR_ESTRELLA && gradoB < CONEXION.MAX_POR_ESTRELLA) {
      seleccionadas.push(c);
      gradosUsados.set(c.a.id, gradoA + 1);
      gradosUsados.set(c.b.id, gradoB + 1);
    }
  }

  // Paso 4: preservar la opacidad previa de cada conexión que ya
  // existía (para que no "parpadeen" al recalcular), y asignar la
  // opacidad objetivo según el puntaje (más puntaje = más visible,
  // con un techo de 0.45 para no saturar el fondo estrellado).
  const claveConexion = (c) =>
    [Math.min(c.a.id, c.b.id), Math.max(c.a.id, c.b.id)].join('-');

  const opacidadPrevia = new Map();
  for (const c of conexiones) {
    opacidadPrevia.set(claveConexion(c), c.opacity);
  }

  conexiones = seleccionadas.map(c => ({
    ...c,
    opacity: opacidadPrevia.get(claveConexion(c)) ?? 0, // arranca en 0 si es nueva -> aparece con fade-in
    opacityTarget: Math.min(0.18 + (c.score - 3) * 0.06, 0.45),
  }));
}

// Centro de transform-origin del #universo-viewport (ver style.css:
// transform-origin: center center). Las estrellas (divs dentro del
// viewport) heredan el transform CSS automáticamente; el canvas de
// conexiones vive FUERA del viewport a propósito, así que debe
// replicar manualmente la misma transformación para que las líneas
// coincidan con las estrellas en cualquier estado de pan/zoom.
// Los valores vienen de config.js (única fuente de verdad).

/**
 * Dibuja todas las conexiones activas en el canvas fijo de
 * conexiones, aplicando manualmente la transformación de cámara
 * (pan + zoom) para que las líneas coincidan pixel a pixel con
 * las estrellas del DOM (que sí reciben el transform vía CSS).
 * Se llama en cada frame del loop de animación.
 */
export function dibujarConexiones(ctx, capaConexiones, camera) {
  ctx.clearRect(0, 0, capaConexiones.width, capaConexiones.height);

  // Offset porque el canvas arranca en -1500px respecto al viewport
  const ox = parseInt(capaConexiones.style.left) * -1 || 0;
  const oy = parseInt(capaConexiones.style.top)  * -1 || 0;

  const zoom = camera ? camera._zoom : 1;
  const camX = camera ? camera._x : 0;
  const camY = camera ? camera._y : 0;

  // Aplica la misma transformación translate+scale (con origen en
  // el centro del viewport) que CSS aplica a las estrellas, para
  // convertir una coordenada "neutra" de estrella en su posición
  // real en pantalla bajo el estado actual de cámara.
  function aPantalla(x, y) {
    const px = VIEWPORT_CENTRO_X + (x - VIEWPORT_CENTRO_X) * zoom + camX;
    const py = VIEWPORT_CENTRO_Y + (y - VIEWPORT_CENTRO_Y) * zoom + camY;
    return { px, py };
  }

  for (const c of conexiones) {
    // Interpolación suave hacia la opacidad objetivo (efecto fade
    // in/out en vez de aparecer/desaparecer de golpe).
    c.opacity += (c.opacityTarget - c.opacity) * 0.025;
    if (c.opacity < 0.005) continue;

    const pa = aPantalla(c.a.x, c.a.y);
    const pb = aPantalla(c.b.x, c.b.y);

    const ax = pa.px + ox, ay = pa.py + oy;
    const bx = pb.px + ox, by = pb.py + oy;

    // Degradado lineal a lo largo de la línea: transparente en los
    // extremos, más visible en el centro, simulando un "hilo de luz".
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0,    hexAColor('#ffffff', 0));
    grad.addColorStop(0.25, hexAColor('#ffffff', c.opacity));
    grad.addColorStop(0.5,  hexAColor('#ffffff', c.opacity * 1.4));
    grad.addColorStop(0.75, hexAColor('#ffffff', c.opacity));
    grad.addColorStop(1,    hexAColor('#ffffff', 0));

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.6 * zoom; // el grosor escala con el zoom para verse consistente
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/**
 * Convierte un color hex (#RRGGBB) a rgba(...) con la opacidad dada.
 * Si el formato no es válido, cae a blanco en vez de pintar
 * "NaN, NaN, NaN" silenciosamente (que rompería el canvas sin avisar).
 */
function hexAColor(hex, alpha) {
  const esHexValido = /^#[0-9a-fA-F]{6}$/.test(hex);
  if (!esHexValido) {
    console.warn(`hexAColor recibió un valor inesperado: "${hex}". Usando blanco como fallback.`);
    return `rgba(255,255,255,${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
