// ui.js
import { enviarHuella } from './api.js';
import { anadirEstrellaAnimada, crearEstrellaTemporal } from './estrellas.js';
import { COLOR_EMOCION, TIEMPOS } from './config.js';
import { camera } from './camera.js';

let elementos = {};
let viewportRef = null;
let intervaloBrillo = null;
let envioEnCurso = false;

export function setElementos(refs) {
  elementos = refs;
  viewportRef = refs.viewport;
}

const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function detenerAnimacionBrillo() {
  if (intervaloBrillo) {
    clearInterval(intervaloBrillo);
    intervaloBrillo = null;
  }
}

function volverAlFormulario() {
  elementos.capaProceso.classList.add('oculto');
  elementos.capaFormulario.classList.remove('oculto');
  elementos.btnEnviar.disabled = false;
  elementos.guiaExploracion.classList.remove('oculto');
  elementos.tituloPoetico.textContent = '✧ Escribe otra huella ✧';

  setTimeout(() => {
    elementos.guiaExploracion.classList.add('oculto');
  }, TIEMPOS.OCULTAR_GUIA);

  if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');
  elementos.botonVolver.classList.add('oculto');
  if (elementos.controlesZoom) elementos.controlesZoom.classList.add('oculto');
  elementos.botonReintentar.classList.add('oculto');
}

function mostrarErrorConexion() {
  detenerAnimacionBrillo();
  elementos.estrellaNaciente.classList.add('oculto');
  if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');
  elementos.textoProceso.textContent = '❌ No se pudo conectar con el backend.';
  elementos.resultadoHuella.classList.add('oculto');
  elementos.botonReintentar.classList.remove('oculto');
}

function reintentarEnvio() {
  elementos.botonReintentar.classList.add('oculto');
  elementos.capaProceso.classList.add('oculto');
  elementos.capaFormulario.classList.remove('oculto');
  elementos.btnEnviar.disabled = false;
}

export async function manejarEnvio(e, callbackRecalcular) {
  e.preventDefault();
  if (envioEnCurso) return;

  const texto = elementos.inputHuella.value.trim();
  if (!texto) {
    elementos.inputHuella.style.borderColor = 'rgba(255,150,150,0.5)';
    setTimeout(() => { elementos.inputHuella.style.borderColor = ''; }, TIEMPOS.PARPADEO_ERROR_INPUT);
    return;
  }

  envioEnCurso = true;

  // ── Paso 1: Ocultar constelación y formulario ──
  if (viewportRef) viewportRef.classList.add('ocultar-constelacion');
  elementos.capaFormulario.classList.add('oculto');
  elementos.capaProceso.classList.remove('oculto');
  elementos.resultadoHuella.classList.add('oculto');
  elementos.botonVolver.classList.add('oculto');
  if (elementos.controlesZoom) elementos.controlesZoom.classList.add('oculto');
  elementos.botonReintentar.classList.add('oculto');
  elementos.textoProceso.textContent = 'El universo está leyendo tu recuerdo...';
  elementos.btnEnviar.disabled = true;

  // ── Paso 2: Estrella temporal girando ──
  elementos.estrellaNaciente.innerHTML = '';
  const temporal = crearEstrellaTemporal('#fce8a0', 3);
  elementos.estrellaNaciente.appendChild(temporal.element);
  elementos.estrellaNaciente.classList.remove('oculto');

  // ── Paso 3: Animación de colores mientras espera respuesta ──
  const colores = Object.values(COLOR_EMOCION);
  intervaloBrillo = setInterval(() => {
    const color = colores[Math.floor(Math.random() * colores.length)];
    const brillo = 0.5 + Math.random() * 1.0;
    const factorBrillo = Math.pow(brillo, 1.8);
    temporal.pixels.forEach(pixel => {
      const blur1 = temporal.pixelSize * 2 * factorBrillo;
      const blur2 = temporal.pixelSize * 5 * factorBrillo;
      pixel.style.background = color;
      pixel.style.boxShadow = `0 0 ${blur1}px ${color}, 0 0 ${blur2}px ${color}`;
    });
  }, 400);

  try {
    const datos = await enviarHuella(texto);

    await pausa(TIEMPOS.SUSPENSO_COLORES);
    detenerAnimacionBrillo();
    temporal.elementoGiro.style.animation = 'none';

    const colorFinal = datos.color || '#f0eae0';
    const factorBrilloFinal = Math.pow(0.8, 1.8);
    temporal.pixels.forEach(pixel => {
      const blur1 = temporal.pixelSize * 2 * factorBrilloFinal;
      const blur2 = temporal.pixelSize * 5 * factorBrilloFinal;
      pixel.style.background = colorFinal;
      pixel.style.boxShadow = `0 0 ${blur1}px ${colorFinal}, 0 0 ${blur2}px ${colorFinal}`;
    });

    // ── Paso 4: Mensaje de conversión ──
    elementos.textoProceso.textContent = '✨ Tu huella se ha convertido en estrella...';
    await pausa(TIEMPOS.MENSAJE_CONVERSION);

    // ── Paso 5: Mostrar categoría y emoción ──
    elementos.textoProceso.textContent = '';
    elementos.resultadoCat.textContent = datos.categoria || 'Huella';
    elementos.resultadoCat.style.color = colorFinal;
    elementos.resultadoEmo.textContent = datos.emocion ? `— ${datos.emocion} —` : '';
    elementos.resultadoHuella.classList.remove('oculto');

    // ── Paso 6: Ocultar estrella temporal y revelar constelación
    //    ANTES de la animación para que sea visible ──
    elementos.estrellaNaciente.classList.add('oculto');
    if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');

    // ── Paso 7: Animación de la nueva estrella (zoom → corazón → vuelo → aterrizaje) ──
    await anadirEstrellaAnimada(datos, callbackRecalcular, camera);
    elementos.inputHuella.value = '';

    // ── Paso 8: Pausa para leer el resultado ──
    await pausa(TIEMPOS.MOSTRAR_RESULTADO);

    // ── Paso 9: Modo exploración libre ──
    elementos.capaProceso.classList.add('oculto');
    elementos.botonVolver.classList.remove('oculto');
    if (elementos.controlesZoom) elementos.controlesZoom.classList.remove('oculto');

  } catch (error) {
    console.error('Error al enviar la huella:', error);
    mostrarErrorConexion();
  } finally {
    envioEnCurso = false;
  }
}

export function configurarBotonesProceso() {
  elementos.botonVolver.addEventListener('click', volverAlFormulario);
  elementos.botonReintentar.addEventListener('click', reintentarEnvio);
}