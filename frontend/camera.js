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
    // Con transform-origin: top left, trasladamos directamente en píxeles
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

export function configurarZoom(viewport) {
  if (zoomConfigurado) {
    console.warn('configurarZoom ya fue llamado antes; se ignora la llamada repetida.');
    return;
  }
  zoomConfigurado = true;

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    camera.targetZoom = Math.min(Math.max(camera.targetZoom * factor, 0.3), 3.5);
  }, { passive: false });
}