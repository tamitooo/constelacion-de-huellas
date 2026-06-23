// api.js
import { API_BASE, COLOR_EMOCION, FETCH_TIMEOUT_MS } from './config.js';

/**
 * fetch con timeout. Si el backend no responde dentro de
 * FETCH_TIMEOUT_MS, se aborta la petición y se lanza un error
 * claro en vez de dejar al usuario esperando indefinidamente.
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

export async function cargarConstelacion() {
  try {
    const resp = await fetchConTimeout(`${API_BASE}/constelacion`);
    if (!resp.ok) throw new Error('Error al cargar constelación');
    const data = await resp.json();
    return data.nodes || [];
  } catch (e) {
    console.warn('Backend no disponible. Cargando datos de ejemplo.', e);
    return [
      { id: 1, categoria: 'Familia', intensidad: 4, emocion: 'Alegría', palabrasClave: ['mamá', 'apoyo'], color: COLOR_EMOCION['Alegría'] },
      { id: 2, categoria: 'Familia', intensidad: 3, emocion: 'Nostalgia', palabrasClave: ['papá', 'hogar'], color: COLOR_EMOCION['Nostalgia'] },
      { id: 3, categoria: 'Amigos', intensidad: 3, emocion: 'Nostalgia', palabrasClave: ['amigos', 'risa'], color: COLOR_EMOCION['Nostalgia'] },
      { id: 4, categoria: 'Amigos', intensidad: 2, emocion: 'Nostalgia', palabrasClave: ['colegio', 'amigos'], color: COLOR_EMOCION['Nostalgia'] },
      { id: 5, categoria: 'Amor', intensidad: 5, emocion: 'Pasión', palabrasClave: ['amor', 'corazón'], color: COLOR_EMOCION['Pasión'] },
      { id: 6, categoria: 'Estudios', intensidad: 2, emocion: 'Curiosidad', palabrasClave: ['estudio', 'aprender'], color: COLOR_EMOCION['Curiosidad'] },
      { id: 7, categoria: 'Crecimiento Personal', intensidad: 4, emocion: 'Gratitud', palabrasClave: ['crecer', 'superar'], color: COLOR_EMOCION['Gratitud'] },
      { id: 8, categoria: 'Crecimiento Personal', intensidad: 3, emocion: 'Gratitud', palabrasClave: ['logro', 'esfuerzo'], color: COLOR_EMOCION['Gratitud'] },
    ];
  }
}

export async function enviarHuella(texto) {
  const resp = await fetchConTimeout(`${API_BASE}/huellas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json();
}