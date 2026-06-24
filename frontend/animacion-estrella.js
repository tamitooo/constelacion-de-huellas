// animacion-estrella.js
// Orquesta la animación completa de una nueva estrella:
//   1. Aparece grande en el centro (zoom in pixel art)
//   2. Dibuja un corazón con estela tipo cometa (se desvanece gradualmente)
//   3. Vuela desde el centro hasta su posición final
//   4. Aterriza con destello + anillos expansivos de píxeles

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

function hexRGB(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Patrón pixel art de estrella de 4 puntas
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
  pts.push({ x: 0, y: 0, op: 1 });
  return pts;
}

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
    // Halo suave
    ctx.fillStyle = `rgba(${r},${g},${b},${op * alpha * 0.25})`;
    ctx.fillRect(px - sz, py - sz, sz * 3, sz * 3);
  });
  ctx.restore();
}

// Curva paramétrica del corazón, normalizada a [-1, 1]
function puntoCorazon(t) {
  const x =  16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x / 17, y: y / 17 };
}

// Corre un callback con rAF durante `duracion` ms, t va de 0 a 1
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
 * @param {string}  color      — hex del color de la estrella
 * @param {number}  destinoX   — coordenada X en pantalla (px)
 * @param {number}  destinoY   — coordenada Y en pantalla (px)
 * @param {number}  [intensidad=3] — 1-5
 */
export async function animarNuevaEstrella({ color, destinoX, destinoY, intensidad = 3 }) {
  // Canvas temporal fijo encima de todo
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

  // ── FASE 1: Zoom in ──────────────────────────────────────────────────────
  await animarFrame(DURACION.ZOOM_IN, (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const escala = lerp(0.1, 3.5, easeOutCubic(t));
    dibujarEstrella(ctx, cx, cy, color, escala, easeOutCubic(t), pixSize);
  });

  // ── FASE 2: Corazón con estela de cometa ────────────────────────────────
  const estela = []; // { x, y, t_nacimiento }
  const radio  = 60 + intensidad * 5;

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
        estela.splice(0, i + 1);
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

    // Estrella se encoge mientras vuela
    const escala = lerp(3.2, 0.8, ease);
    dibujarEstrella(ctx, x, y, color, escala, 1, pixSize);
  });

  // ── FASE 4: Aterrizaje — destello + anillos de píxeles ──────────────────
  await animarFrame(DURACION.ATERRIZAJE, (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Flash radial blanco → color
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

    // 3 anillos de píxeles expansivos desfasados
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

    // La estrella definitiva aparece desde t=0.3
    if (t > 0.3) {
      const alphaE = easeOutCubic((t - 0.3) / 0.7);
      dibujarEstrella(ctx, destinoX, destinoY, color, 1, alphaE, pixSize);
    }
  });

  canvas.remove();
}