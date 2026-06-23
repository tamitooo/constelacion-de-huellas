// ui.js
import { enviarHuella } from './api.js';
import { anadirEstrella, crearEstrellaTemporal } from './estrellas.js';
import { COLOR_EMOCION, TIEMPOS } from './config.js';

let elementos = {};
let viewportRef = null;
let intervaloBrillo = null;

// Bandera simple para evitar que dos envíos corran en paralelo
// (doble click, Enter + click casi simultáneos, etc). Sin esto,
// dos llamadas a manejarEnvio comparten las mismas referencias
// de módulo (intervaloBrillo) y pueden pisarse entre sí a mitad
// de la animación.
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

/** Vuelve al formulario principal, limpio y listo para otra huella. */
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
  elementos.botonReintentar.classList.add('oculto');
}

/** Muestra el error de conexión y ofrece reintentar sin perder el texto escrito. */
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

  // Guarda anti doble-submit: si ya hay un envío corriendo,
  // ignoramos por completo este nuevo intento.
  if (envioEnCurso) return;

  const texto = elementos.inputHuella.value.trim();
  if (!texto) {
    elementos.inputHuella.style.borderColor = 'rgba(255,150,150,0.5)';
    setTimeout(() => {
      elementos.inputHuella.style.borderColor = '';
    }, TIEMPOS.PARPADEO_ERROR_INPUT);
    return;
  }

  envioEnCurso = true;

  // ── Paso 1: Ocultar constelación y formulario ──
  if (viewportRef) viewportRef.classList.add('ocultar-constelacion');
  elementos.capaFormulario.classList.add('oculto');
  elementos.capaProceso.classList.remove('oculto');
  elementos.resultadoHuella.classList.add('oculto');
  elementos.botonVolver.classList.add('oculto');
  elementos.botonReintentar.classList.add('oculto');
  elementos.textoProceso.textContent = 'El universo está leyendo tu recuerdo...';
  elementos.btnEnviar.disabled = true;

  // ── Paso 2: Crear estrella temporal animada ──
  elementos.estrellaNaciente.innerHTML = '';
  const temporal = crearEstrellaTemporal('#FFD700', 3);
  elementos.estrellaNaciente.appendChild(temporal.element);
  elementos.estrellaNaciente.classList.remove('oculto');

  // ── Paso 3: Animación de colores y brillo ──
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

    detenerAnimacionBrillo();

    // ── Paso 4: Mensaje "convertida en estrella" ──
    elementos.textoProceso.textContent = '✨ Tu huella se ha convertido en estrella...';
    await pausa(TIEMPOS.MENSAJE_CONVERSION);

    // ── Paso 5: Mostrar categoría y emoción ──
    elementos.resultadoCat.textContent = datos.categoria || 'Huella';
    elementos.resultadoCat.style.color = datos.color || '#f0eae0';
    elementos.resultadoEmo.textContent = datos.emocion ? `— ${datos.emocion} —` : '';
    elementos.resultadoHuella.classList.remove('oculto');

    // ── Paso 6: Añadir la estrella real a la constelación ──
    anadirEstrella(datos, callbackRecalcular);
    elementos.inputHuella.value = '';

    // ── Paso 7: Revelar la constelación con la nueva estrella ──
    elementos.estrellaNaciente.classList.add('oculto');
    if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');

    // Dar tiempo para observar la nueva estrella antes de ofrecer volver.
    await pausa(TIEMPOS.OBSERVAR_ESTRELLA);

    // ── Paso 8: Mostrar botón "Volver" ──
    elementos.botonVolver.classList.remove('oculto');
    elementos.botonVolver.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (error) {
    console.error('Error al enviar la huella:', error);
    mostrarErrorConexion();
  } finally {
    envioEnCurso = false;
  }
}

/** Conecta los botones estáticos del HTML (Volver / Reintentar) a su lógica. */
export function configurarBotonesProceso() {
  elementos.botonVolver.addEventListener('click', volverAlFormulario);
  elementos.botonReintentar.addEventListener('click', reintentarEnvio);
}