// conexiones.js
import { CONEXION } from './config.js';

let conexiones = [];

export function getConexiones() { return conexiones; }

export function palabrasCompartidas(a, b) {
  if (!a.palabrasClave.length || !b.palabrasClave.length) return 0;
  const setA = new Set(a.palabrasClave.map(p => p.toLowerCase()));
  return b.palabrasClave.filter(p => setA.has(p.toLowerCase())).length;
}

export function distancia(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function recalcularConexiones(estrellas) {
  if (estrellas.length < 2) {
    conexiones = [];
    return;
  }

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

  candidatos.sort((x, y) => y.score - x.score);

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

  const claveConexion = (c) =>
    [Math.min(c.a.id, c.b.id), Math.max(c.a.id, c.b.id)].join('-');

  const opacidadPrevia = new Map();
  for (const c of conexiones) {
    opacidadPrevia.set(claveConexion(c), c.opacity);
  }

  conexiones = seleccionadas.map(c => ({
    ...c,
    opacity: opacidadPrevia.get(claveConexion(c)) ?? 0,
    opacityTarget: Math.min(0.18 + (c.score - 3) * 0.06, 0.45),
  }));
}

// Centro de transform-origin del #universo-viewport (ver style.css:
// transform-origin: center center, sobre un viewport de 4000x4000px
// posicionado en top:0;left:0). Las estrellas (divs dentro del
// viewport) heredan el transform CSS automáticamente; el canvas de
// conexiones vive FUERA del viewport a propósito, así que debe
// replicar manualmente la misma transformación para que las líneas
// coincidan con las estrellas en cualquier estado de pan/zoom.
const ORIGEN_TRANSFORM_X = 2000;
const ORIGEN_TRANSFORM_Y = 2000;

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
    const px = ORIGEN_TRANSFORM_X + (x - ORIGEN_TRANSFORM_X) * zoom + camX;
    const py = ORIGEN_TRANSFORM_Y + (y - ORIGEN_TRANSFORM_Y) * zoom + camY;
    return { px, py };
  }

  for (const c of conexiones) {
    c.opacity += (c.opacityTarget - c.opacity) * 0.025;
    if (c.opacity < 0.005) continue;

    const pa = aPantalla(c.a.x, c.a.y);
    const pb = aPantalla(c.b.x, c.b.y);

    const ax = pa.px + ox, ay = pa.py + oy;
    const bx = pb.px + ox, by = pb.py + oy;

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
    ctx.lineWidth = 0.6 * zoom;
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