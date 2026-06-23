// main.js
import { camera, configurarPan, configurarZoom } from './camera.js';
import { getEstrellas, setCapaEstrellas, anadirEstrella } from './estrellas.js';
import { recalcularConexiones, dibujarConexiones } from './conexiones.js';
import { cargarConstelacion } from './api.js';
import { setElementos, manejarEnvio, configurarBotonesProceso } from './ui.js';

// ── Referencias DOM ──────────────────────────────
const viewport         = document.getElementById('universo-viewport');
const capaConexiones    = document.getElementById('capa-conexiones');
const capaEstrellas     = document.getElementById('capa-estrellas');
const estrellaNaciente  = document.getElementById('estrella-naciente');
const capaFormulario    = document.getElementById('capa-formulario');
const tituloPoetico     = document.getElementById('titulo-poetico');
const form              = document.getElementById('form-huella');
const inputHuella        = document.getElementById('input-huella');
const contadorCaracteres = document.getElementById('contador-caracteres');
const btnEnviar          = document.getElementById('btn-enviar');
const capaProceso        = document.getElementById('capa-proceso');
const textoProceso       = document.getElementById('texto-proceso');
const resultadoHuella     = document.getElementById('resultado-huella');
const resultadoCat        = document.getElementById('resultado-categoria');
const resultadoEmo        = document.getElementById('resultado-emocion');
const guiaExploracion     = document.getElementById('guia-exploracion');
const botonVolver         = document.getElementById('boton-volver');
const botonReintentar     = document.getElementById('boton-reintentar');

// ── Inyectar referencias en ui.js ───────────────
setElementos({
  viewport,
  capaFormulario,
  tituloPoetico,
  inputHuella,
  btnEnviar,
  capaProceso,
  textoProceso,
  resultadoHuella,
  resultadoCat,
  resultadoEmo,
  estrellaNaciente,
  guiaExploracion,
  botonVolver,
  botonReintentar,
});

// ── Configurar capa de estrellas ─────────────────
setCapaEstrellas(capaEstrellas);

// ── Contador de caracteres restantes ─────────────
const MAX_CARACTERES = Number(inputHuella.getAttribute('maxlength')) || 280;

function actualizarContador() {
  const restantes = MAX_CARACTERES - inputHuella.value.length;
  contadorCaracteres.textContent = `${restantes} caracteres restantes`;
  contadorCaracteres.classList.toggle('contador-bajo', restantes <= 20);
}

inputHuella.addEventListener('input', actualizarContador);

// ── Canvas context ───────────────────────────────
const ctx = capaConexiones.getContext('2d');
const VIEWPORT_W = 4000;
const VIEWPORT_H = 4000;

function ajustarCanvas() {
  capaConexiones.width  = VIEWPORT_W;
  capaConexiones.height = VIEWPORT_H;
}

function recalcularYActualizar() {
  recalcularConexiones(getEstrellas());
}

// ── Bucle de animación ──────────────────────────
function animar() {
  camera._x += (camera.targetX - camera._x) * 0.08;
  camera._y += (camera.targetY - camera._y) * 0.08;
  camera._zoom += (camera.targetZoom - camera._zoom) * 0.08;

  // translate negativo: "mover la cámara hacia X" = desplazar el viewport hacia -X
  viewport.style.transform =
    `translate(${-camera._x}px, ${-camera._y}px) scale(${camera._zoom})`;

  dibujarConexiones(ctx, capaConexiones);
  requestAnimationFrame(animar);
}



// ── Inicialización ──────────────────────────────
async function init() {
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  // Centrar la cámara: 
  const offsetX = (VIEWPORT_W / 2) - (window.innerWidth  / 2);
  const offsetY = (VIEWPORT_H / 2) - (window.innerHeight / 2);
  camera.targetX = offsetX; camera._x = offsetX;
  camera.targetY = offsetY; camera._y = offsetY;
  camera.targetZoom = 1;    camera._zoom = 1;

  // Cargar constelación
  const nodes = await cargarConstelacion();
  for (const node of nodes) {
    anadirEstrella(node, recalcularYActualizar);
  }

  // Eventos
  form.addEventListener('submit', (e) => manejarEnvio(e, recalcularYActualizar));
  configurarBotonesProceso();
  configurarPan(viewport, capaProceso);
  configurarZoom(viewport);
  actualizarContador();

  animar();
  inputHuella.focus();
}

document.addEventListener('DOMContentLoaded', init);