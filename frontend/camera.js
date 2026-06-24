// camera.js
export const camera = {
  targetX: 0, targetY: 0, targetZoom: 1,
  _x: 0, _y: 0, _zoom: 1,
};

// Evita que, si configurarPan/configurarZoom se llamaran más de una
// vez por error, se acumulen listeners duplicados en window/viewport.
let panConfigurado = false;
let zoomConfigurado = false;

export function configurarPan(viewport, capaProceso) {
  if (panConfigurado) {
    console.warn('configurarPan ya fue llamado antes; se ignora la llamada repetida.');
    return;
  }
  panConfigurado = true;

  let isDragging = false;
  let startX, startY, startCamX, startCamY;

  const startDrag = (x, y) => {
    if (!capaProceso.classList.contains('oculto')) return;
    isDragging = true;
    startX = x; startY = y;
    startCamX = camera._x; startCamY = camera._y;
    viewport.style.cursor = 'grabbing';
  };

  const moveDrag = (x, y) => {
    if (!isDragging) return;
    camera.targetX = startCamX + (x - startX);
    camera.targetY = startCamY + (y - startY);
  };
  const endDrag = () => {
    isDragging = false;
    viewport.style.cursor = 'default';
  };

  viewport.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
  window.addEventListener('mouseup', endDrag);

  let touchId = null;
  viewport.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (!t) return;
    touchId = t.identifier;
    startDrag(t.clientX, t.clientY);
  }, { passive: true });

  viewport.addEventListener('touchmove', e => {
    const t = Array.from(e.touches).find(t => t.identifier === touchId);
    if (!t) return;
    e.preventDefault();
    moveDrag(t.clientX, t.clientY);
  }, { passive: false });

  viewport.addEventListener('touchend', () => {
    touchId = null;
    endDrag();
  }, { passive: true });
}

// Límites de zoom. Se mantienen aquí (no en config.js) porque son
// puramente de cámara, sin relación con datos de huellas/conexiones.
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;

// Cuánto cambia el zoom con un solo "paso" (rueda normal, botón +/-).
// Mucho más suave que el 10%/evento anterior, que en trackpads se
// disparaba decenas de veces por segundo y hacía que el zoom se
// fuera a ZOOM_MIN casi instantáneamente con un solo gesto.
const PASO_ZOOM_BOTON = 1.2;

export function configurarZoom(viewport) {
  if (zoomConfigurado) {
    console.warn('configurarZoom ya fue llamado antes; se ignora la llamada repetida.');
    return;
  }
  zoomConfigurado = true;

  viewport.addEventListener('wheel', e => {
    e.preventDefault();

    // deltaY puede venir muy distinto según el dispositivo: una
    // rueda de mouse normal manda saltos grandes (~100) pocas veces;
    // un trackpad manda decenas de eventos pequeños (~2-10) por
    // segundo durante un solo gesto. Si tratamos cada evento igual
    // (como antes), el trackpad acumula el mismo cambio total en
    // muchos menos tiempo → se siente descontrolado.
    //
    // Para que ambos se sientan parecido, convertimos deltaY en un
    // factor de zoom proporcional a su magnitud, pero con un tope
    // (clamp) para que NINGÚN evento individual —ni siquiera un
    // salto raro de mouse— pueda mover el zoom más de un 8% de una
    // sola vez.
    const sensibilidad = 0.0015;
    const cambio = Math.max(-0.08, Math.min(0.08, -e.deltaY * sensibilidad));
    const factor = 1 + cambio;

    camera.targetZoom = Math.min(Math.max(camera.targetZoom * factor, ZOOM_MIN), ZOOM_MAX);
  }, { passive: false });
}

/** Acerca un paso fijo (para botón "+"). */
export function zoomIn() {
  camera.targetZoom = Math.min(camera.targetZoom * PASO_ZOOM_BOTON, ZOOM_MAX);
}

/** Aleja un paso fijo (para botón "-"). */
export function zoomOut() {
  camera.targetZoom = Math.max(camera.targetZoom / PASO_ZOOM_BOTON, ZOOM_MIN);
}

/** Restablece pan y zoom al estado inicial (para botón "reset"). */
export function resetCamara() {
  camera.targetX = 0;
  camera.targetY = 0;
  camera.targetZoom = 1;
}