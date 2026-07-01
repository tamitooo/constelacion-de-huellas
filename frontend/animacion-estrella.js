/**
 * ============================================================
 *  animacion-estrella.js
 * ============================================================
 *  Orquesta la secuencia de animación completa que se ve cuando
 *  el visitante envía una huella nueva y esta "nace" como estrella.
 *  Toda la animación se dibuja sobre un <canvas> temporal, fijo y
 *  a pantalla completa (z-index altísimo), que se crea al empezar
 *  y se elimina al terminar — así no interfiere con el resto del
 *  DOM ni con las estrellas ya existentes.
 *
 *  Las 4 fases de la animación (en orden):
 *  ------------------------------------------------------------
 *  1. ZOOM IN     — la estrella aparece en el centro de la
 *                    pantalla, creciendo desde un punto diminuto
 *                    (efecto pixel art).
 *  2. CORAZÓN     — la estrella recorre la silueta de un corazón
 *                    (curva paramétrica), dejando una estela tipo
 *                    cometa que se va desvaneciendo.
 *  3. VUELO       — tras una breve pausa "respirando" en el centro,
 *                    la estrella vuela desde el centro hasta su
 *                    posición final en el universo (destinoX/Y),
 *                    encogiéndose progresivamente y dejando una
 *                    estela más corta.
 *  4. ATERRIZAJE  — destello radial blanco→color en el punto de
 *                    llegada, más 3 anillos de píxeles expansivos
 *                    desfasados en el tiempo, y finalmente la
 *                    estrella "definitiva" se desvanece hacia su
 *                    apariencia final.
 *
 *  Función exportada: animarNuevaEstrella({ color, destinoX,
 *  destinoY, intensidad })
 *  ------------------------------------------------------------
 *  Es async y espera (await) cada fase en orden. Quien la llama
 *  (estrellas.js) espera a que termine para recién entonces pintar
 *  el elemento DOM definitivo de la estrella. Todo el cuerpo corre
 *  dentro de un try/finally: si cualquier fase lanza una excepción,
 *  el finally igual remueve el canvas temporal, evitando que quede
 *  una capa fantasma cubriendo toda la pantalla para siempre.
 *
 *  Utilidades internas:
 *  ------------------------------------------------------------
 *  - easeOutCubic / easeInCubic / easeInOutCubic / lerp: funciones
 *    de interpolación para que los movimientos no se sientan
 *    lineales/robóticos.
 *  - hexRGB(hex): convierte un color hex a {r,g,b}; si el valor no
 *    es un hex válido, cae a dorado en vez de producir NaN
 *    silenciosamente (lo que dejaría la estrella invisible sin
 *    ningún aviso de qué pasó).
 *  - patronEstrella / dibujarEstrella: generan y pintan la silueta
 *    de estrella de 4 puntas en el canvas temporal.
 *  - puntoCorazon(t): curva paramétrica del corazón (fase 2).
 *  - animarFrame(duracion, callback): helper genérico que corre un
 *    callback en cada requestAnimationFrame durante `duracion` ms,
 *    pasándole t de 0 a 1 (además del timestamp), y resuelve su
 *    promesa cuando termina.
 * ============================================================
 */

const DURACION = {
  ZOOM_IN:      600,
  CORAZON:     2200,
  ESTELA_VIDA:  700,
  PAUSA_POST:   350,
  VUELO:       1000,
  ATERRIZAJE:   800,
};

const PIX = 4; // tamaño base del pixel art en px

const esperar = (ms) => new Promise(r => setTimeout(r, ms));

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t)  { return t * t * t; }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Convierte un color hex (#RRGGBB) a sus componentes {r,g,b}.
 * Si el valor no es un hex válido de 6 dígitos (undefined, vacío,
 * formato corto "#fff", nombre de color como "gold", etc.), cae a
 * dorado por defecto en vez de producir NaN silenciosamente: con
 * NaN en rgba(...) el navegador simplemente no dibuja nada, y la
 * estrella se vuelve invisible durante toda la animación sin
 * ningún aviso de qué pasó.
 */
function hexRGB(hex) {
  const esHexValido = typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex);
  if (!esHexValido) {
    console.warn(`hexRGB recibió un valor inesperado: "${hex}". Usando dorado como fallback.`);
    hex = '#fce8a0';
  }
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Patrón pixel art de estrella de 4 puntas: cada punto tiene una
// posición relativa (en unidades de pixSize) y una opacidad, para
// que las puntas se vean con un degradado suave hacia los extremos.
function patronEstrella(pixSize) {
  const pts = [];
  for (let i = -5; i <= 5; i++) {
    const op = 1 - Math.abs(i) / 6.5;
    pts.push({ x: i * pixSize, y: 0, op });
    pts.push({ x: 0, y: i * pixSize, op });
  }
  for (let d = 1; d <= 2; d++) {
    const op = 0.45 - d * 0.1;
    pts.push({ x:  d*pixSize, y:  d*pixSize, op });
    pts.push({ x: -d*pixSize, y:  d*pixSize, op });
    pts.push({ x:  d*pixSize, y: -d*pixSize, op });
    pts.push({ x: -d*pixSize, y: -d*pixSize, op });
  }
  pts.push({ x: 0, y: 0, op: 1 }); // núcleo, siempre a máxima opacidad
  return pts;
}

/** Dibuja una estrella pixel art en (cx, cy) con escala/alpha dados. */
function dibujarEstrella(ctx, cx, cy, color, escala, alpha, pixSize) {
  const { r, g, b } = hexRGB(color);
  const pts = patronEstrella(pixSize);
  const sz = Math.ceil(pixSize * escala);
  ctx.save();
  pts.forEach(({ x, y, op }) => {
    const px = Math.round(cx + x * escala - sz / 2);
    const py = Math.round(cy + y * escala - sz / 2);
    // Núcleo del pixel
    ctx.fillStyle = `rgba(${r},${g},${b},${op * alpha})`;
    ctx.fillRect(px, py, sz, sz);
    // Halo suave (un rectángulo más grande y más transparente detrás)
    ctx.fillStyle = `rgba(${r},${g},${b},${op * alpha * 0.25})`;
    ctx.fillRect(px - sz, py - sz, sz * 3, sz * 3);
  });
  ctx.restore();
}

// Curva paramétrica del corazón, normalizada a [-1, 1] en ambos ejes.
function puntoCorazon(t) {
  const x =  16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x / 17, y: y / 17 };
}

/**
 * Corre `callback(t, timestamp)` en cada requestAnimationFrame
 * durante `duracion` ms (t va de 0 a 1). Devuelve una promesa que
 * se resuelve cuando t llega a 1 — así cada fase de la animación
 * puede simplemente hacer `await animarFrame(...)`.
 */
function animarFrame(duracion, callback) {
  return new Promise(resolve => {
    const inicio = performance.now();
    function tick(ahora) {
      const t = Math.min((ahora - inicio) / duracion, 1);
      callback(t, ahora);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Ejecuta la animación completa de nacimiento de una estrella.
 * @param {string}  color      — hex del color de la estrella
 * @param {number}  destinoX   — coordenada X en pantalla (px)
 * @param {number}  destinoY   — coordenada Y en pantalla (px)
 * @param {number}  [intensidad=3] — 1-5, afecta el tamaño del corazón
 */
export async function animarNuevaEstrella({ color, destinoX, destinoY, intensidad = 3 }) {
  // Canvas temporal fijo encima de todo, dedicado solo a esta animación.
  const canvas = document.createElement('canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  const pixSize = PIX;
  const { r, g, b } = hexRGB(color);

  // Todo lo que sigue va en try/finally: si cualquier fase lanza una
  // excepción (ej. datos inesperados), el finally garantiza que el
  // canvas temporal (fixed, z-index 9999, pantalla completa) se
  // elimine de todas formas. Sin esto, un error a mitad de la
  // animación deja el canvas fantasma cubriendo la pantalla para
  // siempre, ya que canvas.remove() nunca llegaría a ejecutarse.
  try {

  // ── FASE 1: Zoom in ──────────────────────────────────────────────────────
  await animarFrame(DURACION.ZOOM_IN, (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const escala = lerp(0.1, 3.5, easeOutCubic(t));
    dibujarEstrella(ctx, cx, cy, color, escala, easeOutCubic(t), pixSize);
  });

  // ── FASE 2: Corazón con estela de cometa ────────────────────────────────
  const estela = []; // { x, y, t_nacimiento }
  const radio  = 60 + intensidad * 5; // el corazón crece con la intensidad emocional

  await animarFrame(DURACION.CORAZON, (t, ahora) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Punto actual en la curva del corazón (−π a π)
    const angulo = lerp(-Math.PI, Math.PI, t);
    const { x: nx, y: ny } = puntoCorazon(angulo);
    const px = cx + nx * radio;
    const py = cy + ny * radio;

    estela.push({ x: px, y: py, nacidoEn: ahora });

    // Dibujar estela que se desvanece (cometa)
    for (let i = estela.length - 1; i >= 0; i--) {
      const pt  = estela[i];
      const edad = ahora - pt.nacidoEn;
      if (edad > DURACION.ESTELA_VIDA) {
        estela.splice(0, i + 1); // limpia los puntos ya "muertos"
        break;
      }
      const vida = 1 - edad / DURACION.ESTELA_VIDA;
      const sz   = Math.max(1, Math.ceil(pixSize * vida * 1.4));
      // Pixel principal
      ctx.fillStyle = `rgba(${r},${g},${b},${vida * 0.85})`;
      ctx.fillRect(Math.round(pt.x - sz/2), Math.round(pt.y - sz/2), sz, sz);
      // Halo
      if (vida > 0.4) {
        ctx.fillStyle = `rgba(${r},${g},${b},${(vida - 0.4) * 0.3})`;
        ctx.fillRect(Math.round(pt.x - sz*1.5), Math.round(pt.y - sz*1.5), sz*3, sz*3);
      }
    }

    // Estrella siguiendo la curva
    dibujarEstrella(ctx, px, py, color, 1.4, 1, pixSize);
  });

  // ── Pausa post-corazón: la estrella respira en el centro ────────────────
  await animarFrame(DURACION.PAUSA_POST, (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pulso = 3.5 + Math.sin(t * Math.PI * 3) * 0.3;
    dibujarEstrella(ctx, cx, cy, color, pulso, 1, pixSize);
  });

  // ── FASE 3: Vuelo hacia destino ──────────────────────────────────────────
  // destinoX/Y ya son coordenadas de pantalla (estrellas en coordenadas ventana)
  const estelaVuelo = [];

  await animarFrame(DURACION.VUELO, (t, ahora) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ease = easeInOutCubic(t);
    const x = lerp(cx, destinoX, ease);
    const y = lerp(cy, destinoY, ease);

    estelaVuelo.push({ x, y, nacidoEn: ahora });

    // Estela del vuelo
    for (let i = estelaVuelo.length - 1; i >= 0; i--) {
      const pt  = estelaVuelo[i];
      const edad = ahora - pt.nacidoEn;
      const vidaMax = 300;
      if (edad > vidaMax) { estelaVuelo.splice(0, i + 1); break; }
      const vida = 1 - edad / vidaMax;
      const sz   = Math.max(1, Math.ceil(pixSize * vida * 0.9));
      ctx.fillStyle = `rgba(${r},${g},${b},${vida * 0.6})`;
      ctx.fillRect(Math.round(pt.x - sz/2), Math.round(pt.y - sz/2), sz, sz);
    }

    // Estrella se encoge mientras vuela (de grande/cercana a
    // pequeña/lejana, simulando que se aleja hacia su lugar final).
    const escala = lerp(3.2, 0.8, ease);
    dibujarEstrella(ctx, x, y, color, escala, 1, pixSize);
  });

  // ── FASE 4: Aterrizaje — destello + anillos de píxeles ──────────────────
  await animarFrame(DURACION.ATERRIZAJE, (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Flash radial blanco → color: sube rápido (15% del tiempo) y
    // luego se apaga en el resto.
    const flashAlpha = t < 0.15
      ? easeOutCubic(t / 0.15)
      : easeInCubic(1 - (t - 0.15) / 0.85);

    if (flashAlpha > 0.01) {
      const flashR = 90 * flashAlpha;
      const grad = ctx.createRadialGradient(destinoX, destinoY, 0, destinoX, destinoY, flashR);
      grad.addColorStop(0,   `rgba(255,255,255,${flashAlpha * 0.95})`);
      grad.addColorStop(0.35,`rgba(${r},${g},${b},${flashAlpha * 0.7})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(destinoX, destinoY, flashR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 anillos de píxeles expansivos, desfasados en el tiempo para
    // dar sensación de "ondas" sucesivas (como al tirar una piedra
    // al agua).
    [0, 0.12, 0.26].forEach((desfase, idx) => {
      const tA = Math.max(0, Math.min((t - desfase) / 0.75, 1));
      if (tA <= 0) return;
      const progAnillo  = easeOutCubic(tA);
      const radioAnillo = progAnillo * (55 + idx * 28);
      const alphaAnillo = (1 - progAnillo) * (0.9 - idx * 0.22);
      if (alphaAnillo < 0.01) return;

      const numPx = 10 + idx * 5;
      for (let i = 0; i < numPx; i++) {
        const ang = (i / numPx) * Math.PI * 2;
        const px  = destinoX + Math.cos(ang) * radioAnillo;
        const py  = destinoY + Math.sin(ang) * radioAnillo;
        const sz  = Math.max(2, Math.ceil(PIX * (1 - progAnillo * 0.6)));
        ctx.fillStyle = `rgba(${r},${g},${b},${alphaAnillo})`;
        ctx.fillRect(Math.round(px - sz/2), Math.round(py - sz/2), sz, sz);
      }
    });

    // La estrella definitiva aparece (fade-in) desde t=0.3, para que
    // el destello y los anillos tengan protagonismo al principio.
    if (t > 0.3) {
      const alphaE = easeOutCubic((t - 0.3) / 0.7);
      dibujarEstrella(ctx, destinoX, destinoY, color, 1, alphaE, pixSize);
    }
  });

  } finally {
    // Se ejecuta SIEMPRE, haya habido error o no: elimina el canvas
    // temporal para no dejar una capa fantasma sobre la pantalla.
    canvas.remove();
  }
}
