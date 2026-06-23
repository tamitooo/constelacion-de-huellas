// ================================================================
// script.js — Constelación de Huellas (versión simple)
// ================================================================
// Objetivo: conectar con el backend real, mostrar categoría/emoción,
// y crear estrellas en el DOM que se puedan explorar con pan y zoom.
// ================================================================

(function() {
  'use strict';

  // ---- Configuración ----
  const API_BASE = 'http://localhost:4000/api';

  // ---- Referencias al DOM ----
  const viewport = document.getElementById('universo-viewport');
  const capaEstrellas = document.getElementById('capa-estrellas');
  const canvas = document.getElementById('capa-lineas');
  const ctx = canvas.getContext('2d');
  const estrellaNaciente = document.getElementById('estrella-naciente');

  const capaFormulario = document.getElementById('capa-formulario');
  const form = document.getElementById('form-huella');
  const inputHuella = document.getElementById('input-huella');
  const btnEnviar = document.getElementById('btn-enviar');

  const capaProceso = document.getElementById('capa-proceso');
  const textoProceso = document.getElementById('texto-proceso');
  const resultadoHuella = document.getElementById('resultado-huella');
  const resultadoCategoria = document.getElementById('resultado-categoria');
  const resultadoEmocion = document.getElementById('resultado-emocion');

  const guiaExploracion = document.getElementById('guia-exploracion');

  // ---- Estado de la cámara (pan y zoom) ----
  const camera = {
    x: 0,          // desplazamiento en X (píxeles)
    y: 0,
    zoom: 1,       // factor de escala
    _x: 0,
    _y: 0,
    _zoom: 1,
  };

  // ---- Lista de estrellas (datos) ----
  let estrellas = [];

  // ---- Mapeo de zona a coordenadas (dentro del viewport) ----
 function posicionPorZona(zona) {

  const radio = 500;

  return {
    x: window.innerWidth / 2 + (Math.random() - 0.5) * radio * 2,
    y: window.innerHeight / 2 + (Math.random() - 0.5) * radio * 2
  };
}
// ---- Ajustar tamaño del canvas al tamaño de la ventana ----
function ajustarCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', ajustarCanvas);

  // ---- Crear una estrella en el DOM ----
function crearEstrellaDOM(datos) {
  const { x, y, color, tamano, categoria, emocion } = datos;

  const contenedor = document.createElement('div');
  contenedor.className = 'estrella-dom';

  contenedor.style.left = x + 'px';
  contenedor.style.top = y + 'px';
  contenedor.style.width = tamano + 'px';
  contenedor.style.height = tamano + 'px';

  const pixelSize = Math.max(2, tamano / 12);

  const pattern = [];

  const center = 0;

  // cruz principal
  for (let i = -8; i <= 8; i++) {
    pattern.push([i, 0, 8 - Math.floor(Math.abs(i) * 0.8)]);
    pattern.push([0, i, 8 - Math.floor(Math.abs(i) * 0.8)]);
  }

  // diagonales
  for (let d = 1; d <= 4; d++) {
    const b = 5 - d;

    pattern.push([ d,  d, b]);
    pattern.push([-d,  d, b]);
    pattern.push([ d, -d, b]);
    pattern.push([-d, -d, b]);
  }

  pattern.push([0, 0, 8]);

  pattern.forEach(([px, py, brightness]) => {

    const pixel = document.createElement('div');

    const alpha = brightness / 8;

    pixel.style.position = 'absolute';

    pixel.style.width = pixelSize + 'px';
    pixel.style.height = pixelSize + 'px';

    pixel.style.left =
      `calc(50% + ${px * pixelSize}px - ${pixelSize / 2}px)`;

    pixel.style.top =
      `calc(50% + ${py * pixelSize}px - ${pixelSize / 2}px)`;

    pixel.style.background = color;

    pixel.style.opacity = alpha;

    pixel.style.boxShadow =
      `0 0 ${pixelSize * 2}px ${color},
       0 0 ${pixelSize * 4}px ${color}`;

    contenedor.appendChild(pixel);
  });

  contenedor.dataset.categoria = categoria;
  contenedor.dataset.emocion = emocion;

  return contenedor;
}

  // ---- Añadir una estrella al sistema (desde datos del backend) ----
  function anadirEstrella(datosBackend) {
    const pos = posicionPorZona(datosBackend.zona);
    const tamano = (datosBackend.intensidad || 3) * 4 + 12; // escala visual

    const estrella = {
      id: datosBackend.id || Date.now(),
      x: pos.x,
      y: pos.y,
      color: datosBackend.color || '#ffd700',
      tamano: tamano,
      categoria: datosBackend.categoria || 'Huella',
      emocion: datosBackend.emocion || '',
    };

    estrellas.push(estrella);

    // Crear el elemento DOM y agregarlo a la capa
    const el = crearEstrellaDOM(estrella);
    capaEstrellas.appendChild(el);

    return estrella;
  }

  // ---- Cargar la constelación existente desde el backend ----
  async function cargarConstelacion() {
    try {
      const resp = await fetch(`${API_BASE}/constelacion`);
      if (!resp.ok) throw new Error('Error al cargar constelación');
      const data = await resp.json();

      const nodes = data.nodes || [];
      for (const node of nodes) {
        // Usamos los datos del nodo para crear la estrella
        anadirEstrella({
          id: node.id,
          zona: node.zona || 'Centro',
          intensidad: node.intensidad || 3,
          color: node.color || '#ffd700',
          categoria: node.categoria || 'Huella',
          emocion: node.emocion || '',
        });
      }
      console.log(`Cargadas ${estrellas.length} estrellas desde el backend.`);
    } catch (e) {
      console.warn('No se pudo cargar la constelación, usando datos de ejemplo.', e);
      // Datos de ejemplo (para que se vea algo si el backend no está)
      const ejemplos = [
        { zona: 'Oeste', intensidad: 4, color: '#FFD700', categoria: 'Familia', emocion: 'Alegría' },
        { zona: 'Este', intensidad: 3, color: '#7B68EE', categoria: 'Amigos', emocion: 'Nostalgia' },
        { zona: 'Sur', intensidad: 5, color: '#FF6B6B', categoria: 'Amor', emocion: 'Pasión' },
        { zona: 'Norte', intensidad: 2, color: '#4ECDC4', categoria: 'Estudios', emocion: 'Curiosidad' },
        { zona: 'Centro', intensidad: 4, color: '#7CFC00', categoria: 'Crecimiento Personal', emocion: 'Gratitud' },
      ];
      for (const ej of ejemplos) {
        anadirEstrella({ ...ej, id: Date.now() + Math.random() });
      }
    }
  }

  // ---- Enviar huella al backend ----
  async function enviarHuella(texto) {
    const resp = await fetch(`${API_BASE}/huellas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
    return resp.json();
  }

  // ---- Manejar el envío del formulario ----
  async function manejarEnvio(e) {
    e.preventDefault();

    const texto = inputHuella.value.trim();
    if (!texto) {
      inputHuella.style.borderColor = 'rgba(255,150,150,0.5)';
      setTimeout(() => inputHuella.style.borderColor = '', 1200);
      return;
    }

    // Ocultar formulario, mostrar proceso
    capaFormulario.classList.add('oculto');
    capaProceso.classList.remove('oculto');
    resultadoHuella.classList.add('oculto');
    textoProceso.textContent = 'El universo está leyendo tu recuerdo...';
    btnEnviar.disabled = true;

    // Mostrar estrella naciente (animación)
    estrellaNaciente.classList.remove('oculto');

    try {
      const datos = await enviarHuella(texto);
      console.log('✅ Respuesta del backend:', datos);

      // Ocultar estrella naciente
      estrellaNaciente.classList.add('oculto');

      // Mostrar categoría y emoción
      resultadoCategoria.textContent = datos.categoria || 'Huella';
      resultadoCategoria.style.color = datos.color || '#f0eae0';
      resultadoEmocion.textContent = datos.emocion ? `— ${datos.emocion} —` : '';
      resultadoHuella.classList.remove('oculto');
      textoProceso.textContent = 'Tu huella se ha convertido en estrella.';

      // Crear la estrella en la constelación
      anadirEstrella(datos);

      // Limpiar input
      inputHuella.value = '';

      // Después de un momento, mostrar la guía de exploración y permitir interacción
      setTimeout(() => {
        capaProceso.classList.add('oculto');
        guiaExploracion.classList.remove('oculto');

        // Mostrar de nuevo el formulario para que el usuario pueda escribir otra huella
        // (pero con un mensaje sutil)
        capaFormulario.classList.remove('oculto');
        // Cambiar el título poético para dar feedback
        document.getElementById('titulo-poetico').textContent = '✧ Escribe otra huella ✧';
        btnEnviar.disabled = false;

        // Ocultar la guía después de 8 segundos
        setTimeout(() => {
          guiaExploracion.classList.add('oculto');
        }, 8000);
      }, 1800);

    } catch (error) {
      console.error('❌ Error:', error);
      estrellaNaciente.classList.add('oculto');
      textoProceso.textContent = 'No se pudo conectar con el backend. Revisa que esté corriendo en http://localhost:4000';
      resultadoHuella.classList.add('oculto');
      // Botón para reintentar
      const reintentar = document.createElement('button');
      reintentar.textContent = 'Reintentar';
      reintentar.style.cssText = `
        margin-top: 1.5rem;
        padding: 0.6rem 2rem;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,235,210,0.2);
        border-radius: 40px;
        color: #f0eae0;
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s;
      `;
      reintentar.onmouseenter = () => { reintentar.style.background = 'rgba(255,220,160,0.08)'; };
      reintentar.onmouseleave = () => { reintentar.style.background = 'rgba(255,255,255,0.05)'; };
      reintentar.onclick = () => {
        capaProceso.classList.add('oculto');
        capaFormulario.classList.remove('oculto');
        btnEnviar.disabled = false;
        reintentar.remove();
      };
      capaProceso.appendChild(reintentar);
    }
  }

  // ---- Interacción: arrastrar el viewport (pan) ----
  function configurarPan() {
    let isDragging = false;
    let startX, startY, startCamX, startCamY;

    const startDrag = (x, y) => {
      if (!capaProceso.classList.contains('oculto')) return; // no mover mientras procesa
      isDragging = true;
      startX = x;
      startY = y;
      startCamX = camera._x;
      startCamY = camera._y;
      viewport.style.cursor = 'grabbing';
    };

    const moveDrag = (x, y) => {
      if (!isDragging) return;
      const dx = (x - startX) / camera._zoom;
      const dy = (y - startY) / camera._zoom;
      camera.targetX = startCamX - dx;
      camera.targetY = startCamY - dy;
    };

    const endDrag = () => {
      isDragging = false;
      viewport.style.cursor = 'default';
    };

    // Mouse
    viewport.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      moveDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', endDrag);

    // Touch
    let touchId = null;
    viewport.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchId = touch.identifier;
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.touches).find(t => t.identifier === touchId);
      if (!touch) return;
      e.preventDefault();
      moveDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      touchId = null;
      endDrag();
    }, { passive: true });
  }

  // ---- Interacción: zoom con la rueda ----
  function configurarZoom() {
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const nuevoZoom = Math.min(Math.max(camera.targetZoom * factor, 0.3), 3.0);
      camera.targetZoom = nuevoZoom;
    }, { passive: false });
  }

  // ---- Bucle de animación (interpolación suave) ----
  function animar() {
    // Interpolar cámara
    camera._x += (camera.targetX - camera._x) * 0.08;
    camera._y += (camera.targetY - camera._y) * 0.08;
    camera._zoom += (camera.targetZoom - camera._zoom) * 0.08;

    // Aplicar transformación al viewport
    const { _x, _y, _zoom } = camera;
    viewport.style.transform = `translate(${_x}px, ${_y}px) scale(${_zoom})`;

    requestAnimationFrame(animar);
  }

  // ---- Inicialización ----
  async function init() {
    // Cargar constelación existente
    await cargarConstelacion();
    ajustarCanvas();

    // Configurar cámara inicial
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1;
    camera._x = 0;
    camera._y = 0;
    camera._zoom = 1;
    camera.targetX = 0;
    camera.targetY = 0;
    camera.targetZoom = 1;

    // Configurar eventos
    form.addEventListener('submit', manejarEnvio);
    configurarPan();
    configurarZoom();

    // Iniciar bucle de animación
    animar();

    // Enfocar el textarea
    inputHuella.focus();
  }

  // Llamar a init cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();