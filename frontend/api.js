/**
 * ============================================================
 *  api.js
 * ============================================================
 *  Capa de comunicación entre el frontend y el backend Express.
 *  Es el único archivo que hace fetch() directamente al backend;
 *  el resto del frontend (main.js, ui.js) llama a estas funciones
 *  en vez de construir URLs o manejar fetch a mano.
 *
 *  Funciones exportadas:
 *  ------------------------------------------------------------
 *  - cargarConstelacion() -> GET /api/constelacion. Si el backend
 *    no responde (apagado, sin red, etc.), NO rompe la app: cae
 *    a un set de huellas de ejemplo hardcodeadas, para que la
 *    instalación siempre muestre algo en pantalla (importante en
 *    un contexto de exhibición en vivo).
 *  - enviarHuella(texto) -> POST /api/huellas con el texto nuevo.
 *    Si falla, lanza el error hacia quien la llamó (ui.js), que
 *    es responsable de mostrar el estado de error al usuario.
 *
 *  Función interna: fetchConTimeout()
 *  ------------------------------------------------------------
 *  Envuelve fetch() con un AbortController para que ninguna
 *  petición quede "colgada" indefinidamente si el backend no
 *  responde — después de FETCH_TIMEOUT_MS (config.js) se aborta
 *  y se lanza un error explicativo.
 * ============================================================
 */

import { API_BASE, COLOR_EMOCION, FETCH_TIMEOUT_MS } from './config.js';

/**
 * fetch() con límite de tiempo. Si el servidor no responde antes
 * de FETCH_TIMEOUT_MS, aborta la petición y lanza un error claro
 * en vez de dejar la promesa pendiente para siempre.
 */
async function fetchConTimeout(url, opciones = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...opciones, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado (${FETCH_TIMEOUT_MS / 1000}s) al contactar el servidor.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Carga los nodos (estrellas) de la constelación desde el backend.
 * Si el backend no está disponible, devuelve un set de huellas de
 * ejemplo para que la instalación no arranque completamente vacía
 * ni rota (pensado para demos/exhibiciones donde el backend podría
 * fallar sin que haya alguien técnico cerca para reiniciarlo).
 */
export async function cargarConstelacion() {
  try {
    const resp = await fetchConTimeout(`${API_BASE}/constelacion`);
    if (!resp.ok) throw new Error('Error al cargar constelación');
    const data = await resp.json();
    return data.nodes || [];
  } catch (e) {
    console.warn('Backend no disponible. Cargando datos de ejemplo.', e);

    // Datos de ejemplo: cubren las 5 categorías y varias emociones,
    // para que la constelación de respaldo se vea completa y
    // representativa aunque el backend esté caído.
    return [
      {
        id: 1,
        categoria: 'Familia y Raíces',
        intensidad: 4,
        emocion: 'Alegría',
        palabrasClave: ['mamá', 'apoyo'],
        color: COLOR_EMOCION['Alegría'],
      },
      {
        id: 2,
        categoria: 'Familia y Raíces',
        intensidad: 3,
        emocion: 'Nostalgia',
        palabrasClave: ['papá', 'hogar'],
        color: COLOR_EMOCION['Nostalgia'],
      },
      {
        id: 3,
        categoria: 'Amistad y Complicidad',
        intensidad: 3,
        emocion: 'Alegría',
        palabrasClave: ['amigos', 'risa'],
        color: COLOR_EMOCION['Alegría'],
      },
      {
        id: 4,
        categoria: 'Amistad y Complicidad',
        intensidad: 2,
        emocion: 'Nostalgia',
        palabrasClave: ['colegio', 'amigos'],
        color: COLOR_EMOCION['Nostalgia'],
      },
      {
        id: 5,
        categoria: 'Amor y Desamor',
        intensidad: 5,
        emocion: 'Amor',
        palabrasClave: ['amor', 'corazón'],
        color: COLOR_EMOCION['Amor'],
      },
      {
        id: 6,
        categoria: 'Aprendizaje y Transformación',
        intensidad: 2,
        emocion: 'Transformación',
        palabrasClave: ['estudio', 'aprender'],
        color: COLOR_EMOCION['Transformación'],
      },
      {
        id: 7,
        categoria: 'Aprendizaje y Transformación',
        intensidad: 4,
        emocion: 'Gratitud',
        palabrasClave: ['crecer', 'superar'],
        color: COLOR_EMOCION['Gratitud'],
      },
      {
        id: 8,
        categoria: 'Pérdida y Ausencia',
        intensidad: 4,
        emocion: 'Tristeza',
        palabrasClave: ['ausencia', 'recuerdo'],
        color: COLOR_EMOCION['Tristeza'],
      },
      {
        id: 9,
        categoria: 'Pérdida y Ausencia',
        intensidad: 3,
        emocion: 'Resiliencia',
        palabrasClave: ['superar', 'pérdida'],
        color: COLOR_EMOCION['Resiliencia'],
      },
    ];
  }
}

/**
 * Envía una huella nueva (texto libre escrito por el visitante)
 * al backend, que la clasificará con Gemini y la persistirá.
 * Devuelve la huella ya completa (con categoría, emoción, color,
 * etc.) para que el frontend pueda animarla como estrella nueva.
 */
export async function enviarHuella(texto) {
  const resp = await fetchConTimeout(`${API_BASE}/huellas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json();
}
