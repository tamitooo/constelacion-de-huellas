// api.js
import { API_BASE, COLOR_EMOCION, FETCH_TIMEOUT_MS } from './config.js';

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

export async function enviarHuella(texto) {
  const resp = await fetchConTimeout(`${API_BASE}/huellas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  return resp.json();
}