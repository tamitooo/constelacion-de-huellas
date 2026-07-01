/**
 * ============================================================
 *  ui.js
 * ============================================================
 *  Orquesta todo el flujo de UI del envío de una huella: desde
 *  que el visitante hace submit en el formulario, pasando por la
 *  pantalla de "procesando" con la estrella temporal girando, el
 *  resultado (categoría + emoción), la animación de nacimiento de
 *  la estrella definitiva, hasta volver al modo de exploración
 *  libre de la constelación. No dibuja el universo ni calcula
 *  posiciones: para eso delega en estrellas.js, api.js y
 *  animacion-estrella.js (esta última, indirectamente, a través
 *  de anadirEstrellaAnimada).
 *
 *  Estado interno del módulo:
 *  ------------------------------------------------------------
 *  - elementos: objeto con todas las referencias DOM necesarias,
 *    inyectado una sola vez desde main.js vía setElementos().
 *  - viewportRef: atajo a elementos.viewport (el contenedor al
 *    que se le agrega/quita la clase 'ocultar-constelacion').
 *  - intervaloBrillo: id del setInterval que hace parpadear de
 *    colores la estrella temporal mientras se espera la respuesta
 *    de Gemini (se debe limpiar siempre con detenerAnimacionBrillo,
 *    o quedaría corriendo en segundo plano para siempre).
 *  - envioEnCurso: flag simple para evitar que el usuario dispare
 *    dos envíos en paralelo (doble click, doble submit, etc.).
 *
 *  Funciones exportadas:
 *  ------------------------------------------------------------
 *  - setElementos(refs): recibe y guarda las referencias DOM
 *    (llamado una única vez desde main.js).
 *  - manejarEnvio(e, callbackRecalcular): handler del evento
 *    submit del formulario. Es el corazón de este archivo — ver
 *    el desglose paso a paso más abajo, sobre la función misma.
 *  - configurarBotonesProceso(): registra los listeners de los
 *    botones "Volver" y "Reintentar".
 *
 *  Funciones internas:
 *  ------------------------------------------------------------
 *  - pausa(ms): promesa que se resuelve tras `ms` milisegundos,
 *    usada para darle ritmo narrativo a cada etapa (ver TIEMPOS
 *    en config.js).
 *  - detenerAnimacionBrillo(): limpia el setInterval del parpadeo
 *    de colores de la estrella temporal.
 *  - volverAlFormulario(): resetea toda la UI al estado inicial
 *    (formulario visible, constelación visible, botones flotantes
 *    ocultos) para que el visitante pueda escribir otra huella.
 *  - mostrarErrorConexion(): estado de error cuando enviarHuella()
 *    falla (backend caído, timeout, etc.) — muestra el botón
 *    "Reintentar" en vez de dejar la UI colgada.
 *  - reintentarEnvio(): vuelve al formulario tras un error, sin
 *    pasar por toda la secuencia de "volver" normal.
 * ============================================================
 */

import { enviarHuella } from './api.js';
import { anadirEstrellaAnimada, crearEstrellaTemporal } from './estrellas.js';
import { COLOR_EMOCION, TIEMPOS } from './config.js';
import { camera } from './camera.js';

let elementos = {};
let viewportRef = null;
let intervaloBrillo = null;
let envioEnCurso = false;

/**
 * Recibe las referencias DOM que main.js recolectó, y guarda un
 * atajo a viewportRef (elementos.viewport) para no repetir la
 * misma propiedad en cada función de este archivo.
 */
export function setElementos(refs) {
  elementos = refs;
  viewportRef = refs.viewport;
}

/** Promesa que se resuelve tras `ms` milisegundos — usada para dar ritmo a la narrativa visual. */
const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Detiene el intervalo que hace parpadear de colores la estrella
 * temporal. Debe llamarse siempre que se sale del estado "esperando
 * respuesta de Gemini" (éxito o error), o el interval seguiría
 * corriendo en segundo plano indefinidamente.
 */
function detenerAnimacionBrillo() {
  if (intervaloBrillo) {
    clearInterval(intervaloBrillo);
    intervaloBrillo = null;
  }
}

/**
 * Restablece la UI al estado inicial: oculta la capa de proceso,
 * muestra de nuevo el formulario (con un mensaje distinto, invitando
 * a escribir otra huella), y oculta los controles de exploración
 * (botón volver, controles de zoom) ya que se vuelve al modo
 * "formulario", no al modo "explorando constelación".
 */
function volverAlFormulario() {
  elementos.capaProceso.classList.add('oculto');
  elementos.capaFormulario.classList.remove('oculto');
  elementos.btnEnviar.disabled = false;
  elementos.guiaExploracion.classList.remove('oculto');
  elementos.tituloPoetico.textContent = '✧ Escribe otra huella ✧';

  // La guía de exploración se vuelve a mostrar brevemente y luego
  // se desvanece sola, igual que en la primera carga de la página.
  setTimeout(() => {
    elementos.guiaExploracion.classList.add('oculto');
  }, TIEMPOS.OCULTAR_GUIA);

  if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');
  elementos.botonVolver.classList.add('oculto');
  if (elementos.controlesZoom) elementos.controlesZoom.classList.add('oculto');
  elementos.botonReintentar.classList.add('oculto');
}

/**
 * Estado de error: se activa cuando enviarHuella() falla (backend
 * caído, timeout, etc.). En vez de dejar la UI congelada en
 * "procesando...", muestra un mensaje claro y el botón "Reintentar",
 * revelando de nuevo la constelación existente detrás.
 */
function mostrarErrorConexion() {
  detenerAnimacionBrillo();
  elementos.estrellaNaciente.classList.add('oculto');
  if (viewportRef) viewportRef.classList.remove('ocultar-constelacion');
  elementos.textoProceso.textContent = '❌ No se pudo conectar con el backend.';
  elementos.resultadoHuella.classList.add('oculto');
  elementos.botonReintentar.classList.remove('oculto');
}

/**
 * Handler del botón "Reintentar": vuelve directo al formulario
 * (sin la narrativa de "escribe otra huella" de volverAlFormulario,
 * ya que acá el usuario ni siquiera llegó a ver un resultado).
 */
function reintentarEnvio() {
  elementos.botonReintentar.classList.add('oculto');
  elementos.capaProceso.classList.add('oculto');
  elementos.capaFormulario.classList.remove('oculto');
  elementos.btnEnviar.disabled = false;
}

/**
 * Handler principal: se ejecuta al hacer submit del formulario.
 * Es una máquina de estados lineal que va mostrando distintas
 * etapas narrativas mientras la huella se clasifica y se convierte
 * en estrella. Resumen paso a paso:
 *
 *   1. Validar que el texto no esté vacío (si lo está, feedback
 *      visual breve en el borde del input y se corta el flujo).
 *   2. Ocultar constelación + formulario, mostrar capa de proceso.
 *   3. Crear una estrella temporal (girando) como indicador de carga.
 *   4. Animar sus colores al azar cada 400ms mientras se espera la
 *      respuesta del backend (efecto "el universo está pensando").
 *   5. Llamar a enviarHuella(texto) (api.js) — await hasta tener
 *      la clasificación real (categoría, emoción, color, etc.).
 *   6. Fijar el color definitivo en la estrella temporal y detener
 *      el parpadeo aleatorio.
 *   7. Mostrar el mensaje "tu huella se ha convertido en estrella".
 *   8. Revelar la categoría y emoción resultantes.
 *   9. Ocultar la estrella temporal y volver a mostrar la
 *      constelación (para que la animación de nacimiento — paso
 *      siguiente — sea visible sobre el universo real).
 *  10. Ejecutar anadirEstrellaAnimada() (estrellas.js), que dispara
 *      la secuencia completa de nacimiento (zoom→corazón→vuelo→
 *      aterrizaje) y solo entonces pinta la estrella definitiva.
 *  11. Pausa para que el visitante alcance a leer el resultado.
 *  12. Pasar a modo exploración libre (botón volver + zoom visibles).
 *
 *  Cualquier error en el camino (típicamente en el fetch de
 *  enviarHuella) cae al catch → mostrarErrorConexion(). El finally
 *  siempre libera el flag envioEnCurso, incluso si algo falla.
 */
export async function manejarEnvio(e, callbackRecalcular) {
  e.preventDefault();
  if (envioEnCurso) return; // evita doble envío por doble click/submit

  const texto = elementos.inputHuella.value.trim();
  if (!texto) {
    // Feedback visual breve (borde rojizo) en vez de un alert molesto.
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
  // Recorre al azar la paleta completa de emociones (COLOR_EMOCION)
  // cada 400ms, dando la sensación de que el sistema está "probando"
  // distintas emociones antes de decidir la definitiva.
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
    // Llamada real al backend: clasifica el texto con Gemini y
    // devuelve la huella ya completa (categoría, emoción, color...).
    const datos = await enviarHuella(texto);

    await pausa(TIEMPOS.SUSPENSO_COLORES);
    detenerAnimacionBrillo();
    temporal.elementoGiro.style.animation = 'none'; // detiene el giro, ya se sabe el resultado

    // Fija el color definitivo (el de la emoción clasificada) en
    // vez de seguir parpadeando al azar.
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
    // anadirEstrellaAnimada (estrellas.js) espera a que termine toda
    // la secuencia visual antes de pintar el elemento DOM definitivo.
    await anadirEstrellaAnimada(datos, callbackRecalcular, camera);
    elementos.inputHuella.value = '';

    // ── Paso 8: Pausa para leer el resultado ──
    await pausa(TIEMPOS.MOSTRAR_RESULTADO);

    // ── Paso 9: Modo exploración libre ──
    elementos.capaProceso.classList.add('oculto');
    elementos.botonVolver.classList.remove('oculto');
    if (elementos.controlesZoom) elementos.controlesZoom.classList.remove('oculto');

  } catch (error) {
    // Cualquier falla en el camino (típicamente el fetch de
    // enviarHuella) termina en el estado de error, con la opción
    // de reintentar sin perder el texto ya escrito.
    console.error('Error al enviar la huella:', error);
    mostrarErrorConexion();
  } finally {
    // Se libera siempre, haya éxito o error, para no dejar la app
    // bloqueada creyendo que hay un envío en curso para siempre.
    envioEnCurso = false;
  }
}

/**
 * Registra los listeners de los dos botones que dependen de este
 * módulo: "Volver" (tras ver un resultado exitoso) y "Reintentar"
 * (tras un error de conexión). Se llama una sola vez desde
 * main.js, durante init().
 */
export function configurarBotonesProceso() {
  elementos.botonVolver.addEventListener('click', volverAlFormulario);
  elementos.botonReintentar.addEventListener('click', reintentarEnvio);
}