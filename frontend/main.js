// main.js
import { camera, configurarPan, configurarZoom, zoomIn, zoomOut, resetCamara } from './camera.js';
import { getEstrellas, setCapaEstrellas, anadirEstrella } from './estrellas.js';
import { recalcularConexiones, dibujarConexiones } from './conexiones.js';
import { cargarConstelacion } from './api.js';
import { setElementos, manejarEnvio, configurarBotonesProceso } from './ui.js';

// ── Referencias DOM ──────────────────────────────
const universoContenedor = document.getElementById('universo-contenedor');
const viewport          = document.getElementById('universo-viewport');
const capaConexiones    = document.getElementById('capa-conexiones');
const capaEstrellas     = document.getElementById('capa-estrellas');
const estrellaNaciente  = document.getElementById('estrella-naciente');
const capaFormulario    = document.getElementById('capa-formulario');
const tituloPoetico     = document.getElementById('titulo-poetico');
const form              = document.getElementById('form-huella');
const inputHuella       = document.getElementById('input-huella');
const contadorCaracteres = document.getElementById('contador-caracteres');
const btnEnviar         = document.getElementById('btn-enviar');
const capaProceso       = document.getElementById('capa-proceso');
const textoProceso      = document.getElementById('texto-proceso');
const resultadoHuella   = document.getElementById('resultado-huella');
const resultadoCat      = document.getElementById('resultado-categoria');
const resultadoEmo      = document.getElementById('resultado-emocion');
const guiaExploracion   = document.getElementById('guia-exploracion');
const botonVolver       = document.getElementById('boton-volver');
const botonReintentar   = document.getElementById('boton-reintentar');
const controlesZoom     = document.getElementById('controles-zoom');
const botonZoomMas      = document.getElementById('boton-zoom-mas');
const botonZoomMenos    = document.getElementById('boton-zoom-menos');
const botonZoomReset    = document.getElementById('boton-zoom-reset');

// ── Inyectar referencias en ui.js ───────────────
setElementos({
  // viewportRef: el elemento al que se le agrega/quita la clase
  // 'ocultar-constelacion'. Debe ser #universo-contenedor porque
  // tanto #capa-estrellas (dentro del viewport con pan/zoom) como
  // #capa-conexiones (fijo, fuera del viewport) son descendientes
  // suyos. Ver el selector CSS correspondiente en style.css.
  viewport: universoContenedor,
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
  controlesZoom,
});

setCapaEstrellas(capaEstrellas);

// ── Contador de caracteres ───────────────────────
const MAX_CARACTERES = Number(inputHuella.getAttribute('maxlength')) || 280;
function actualizarContador() {
  const restantes = MAX_CARACTERES - inputHuella.value.length;
  contadorCaracteres.textContent = `${restantes} caracteres restantes`;
  contadorCaracteres.classList.toggle('contador-bajo', restantes <= 20);
}
inputHuella.addEventListener('input', actualizarContador);

// ── Canvas de conexiones ─────────────────────────
const ctx = capaConexiones.getContext('2d');

function ajustarCanvas() {
  // El canvas cubre un área grande centrada en la ventana
  // para que las estrellas dispersas siempre queden dentro
  const margen = 1500;
  const anchoTotal = window.innerWidth  + margen * 2;
  const altoTotal  = window.innerHeight + margen * 2;

  // Atributo width/height: tamaño real del "lienzo" donde se dibuja.
  capaConexiones.width  = anchoTotal;
  capaConexiones.height = altoTotal;

  // CSS width/height: tamaño VISUAL en pantalla. Debe coincidir 1:1
  // con el lienzo, o el navegador escala el dibujo (estirándolo o
  // comprimiéndolo) y las líneas dejan de coincidir con las estrellas
  // — el CSS heredado (width:100%/height:100%) lo dejaba del tamaño
  // de la ventana, mientras el lienzo real era más grande por el
  // margen, así que todo se veía encogido/desplazado.
  capaConexiones.style.width  = `${anchoTotal}px`;
  capaConexiones.style.height = `${altoTotal}px`;

  // Desplazar el canvas para que el origen (0,0) esté en el centro visual
  capaConexiones.style.left = `-${margen}px`;
  capaConexiones.style.top  = `-${margen}px`;
}

function recalcularYActualizar() {
  recalcularConexiones(getEstrellas());
}

// ── Bucle de animación ───────────────────────────
function animar() {
  camera._x    += (camera.targetX    - camera._x)    * 0.08;
  camera._y    += (camera.targetY    - camera._y)    * 0.08;
  camera._zoom += (camera.targetZoom - camera._zoom) * 0.08;

  // El viewport se traslada: mover la cámara → desplazar el div hacia -X/-Y
  // Importante: SOLO #universo-viewport recibe el transform. El canvas
  // de conexiones vive fuera de él a propósito (ver index.html / style.css)
  // y por eso usa coordenadas de ventana directamente, sin transform.
  viewport.style.transform =
    `translate(${camera._x}px, ${camera._y}px) scale(${camera._zoom})`;

  // Las conexiones se dibujan en el canvas fijo, usando las coordenadas
  // reales de las estrellas (que son coordenadas de ventana).
  dibujarConexiones(ctx, capaConexiones, camera);
  requestAnimationFrame(animar);
}

// ── Inicialización ───────────────────────────────
async function init() {
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  camera.targetX = 0; camera._x = 0;
  camera.targetY = 0; camera._y = 0;
  camera.targetZoom = 1; camera._zoom = 1;

  // Si cargarConstelacion() falla (backend caído, red, etc.), antes
  // esto interrumpía init() por completo: ningún listener quedaba
  // registrado (ni el formulario, ni pan/zoom, ni los botones), así
  // que la app entera se quedaba muda y sin ningún aviso visible —
  // solo un error en la consola que el usuario normal nunca ve.
  // Con el try/catch, si falla la carga inicial seguimos adelante:
  // la constelación arranca vacía (en vez de no arrancar nada) y el
  // usuario puede seguir escribiendo y enviando una huella nueva.
  try {
    const nodes = await cargarConstelacion();
    for (const node of nodes) {
      anadirEstrella(node, recalcularYActualizar);
    }
  } catch (error) {
    console.error('No se pudo cargar la constelación inicial:', error);
    tituloPoetico.textContent = '✧ No se pudo cargar tu constelación, pero puedes seguir escribiendo ✧';
  }

  form.addEventListener('submit', (e) => manejarEnvio(e, recalcularYActualizar));
  configurarBotonesProceso();
  configurarPan(viewport, capaProceso);
  configurarZoom(viewport);
  botonZoomMas.addEventListener('click', zoomIn);
  botonZoomMenos.addEventListener('click', zoomOut);
  botonZoomReset.addEventListener('click', resetCamara);
  actualizarContador();

  animar();
  inputHuella.focus();
}

document.addEventListener('DOMContentLoaded', init);