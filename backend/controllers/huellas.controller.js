/**
 * ============================================================
 *  controllers/huellas.controller.js
 * ============================================================
 *  Contiene la lógica de negocio de cada endpoint: recibe la
 *  petición HTTP, orquesta el trabajo (clasificar con IA, leer/
 *  escribir en el archivo de datos, calcular conexiones) y arma
 *  la respuesta JSON.
 *
 *  Responsabilidades de este archivo:
 *  ------------------------------------------------------------
 *  1. crearHuella        -> valida el texto recibido, lo manda a
 *                            Gemini para clasificarlo (categoría,
 *                            emoción, intensidad, palabras clave),
 *                            calcula color y zona, y persiste la
 *                            huella en el archivo JSON.
 *  2. obtenerHuellas      -> devuelve todas las huellas guardadas
 *                            tal cual están en el archivo.
 *  3. obtenerConstelacion -> transforma las huellas en un grafo
 *                            { nodes, links } comparando cada par
 *                            de huellas por palabras clave
 *                            compartidas, para que el frontend
 *                            pueda dibujar las líneas de conexión.
 *
 *  Mapas de apoyo (constantes locales):
 *  ------------------------------------------------------------
 *  - COLORES_POR_EMOCION: asigna un color hex a cada emoción
 *    posible devuelta por Gemini. Debe mantenerse sincronizado
 *    con COLOR_EMOCION del frontend (frontend/config.js).
 *  - obtenerZona: ubica cada categoría en un "cuadrante" del
 *    universo visual (Norte/Sur/Este/Oeste/Centro), usado luego
 *    por el frontend (ZONA_OFFSET en config.js) para posicionar
 *    las estrellas agrupadas por temática.
 * ============================================================
 */

const { clasificarHuella } = require('../services/gemini.service');
const { readHuellas, addHuella, getNextId } = require('../utils/fileManager');


// Color asociado a cada emoción posible. Se guarda en cada huella
// para que el frontend no tenga que recalcularlo.
const COLORES_POR_EMOCION = {
  'Amor':           '#BC587B',  // Rosa Eléctrico / Magenta
  'Alegría':        '#fce8a0',  // Dorado / Amarillo cálido
  'Empatía':        '#00CED1',  // Verde Esmeralda / Turquesa
  'Gratitud':       '#00CED1',  // Verde Esmeralda / Turquesa (mismo grupo que Empatía)
  'Tristeza':       '#3A4FC5',  // Azul Profundo / Índigo
  'Nostalgia':      '#3A4FC5',  // Azul Profundo / Índigo (mismo grupo que Tristeza)
  'Resiliencia':    '#8A2BE2',  // Violeta / Morado
  'Transformación': '#8A2BE2',  // Violeta / Morado (mismo grupo que Resiliencia)
  'Ira':            '#DC143C',  // Rojo Vivo / Carmesí
  'Neutral':        '#FFFFFF',  // Blanco
};

/** Devuelve el color hex asociado a una emoción (blanco si no se reconoce). */
const obtenerColor = (emocion) => {
  return COLORES_POR_EMOCION[emocion] || '#FFFFFF';
};

/**
 * Asigna una "zona" (cuadrante del universo visual) según la
 * categoría clasificada por Gemini. El frontend usa esta zona
 * (ver ZONA_OFFSET en config.js) para agrupar visualmente las
 * estrellas de la misma temática.
 */
const obtenerZona = (categoria) => {
  const zonas = {
    'Familia y Raíces':          'Oeste',
    'Amistad y Complicidad':     'Este',
    'Amor y Desamor':            'Sur',
    'Aprendizaje y Transformación': 'Norte',
    'Pérdida y Ausencia':        'Centro',
  };
  return zonas[categoria] || 'Centro';
};

/**
 * POST /api/huellas
 * ------------------------------------------------------------
 * Recibe { texto } en el body, lo valida, lo clasifica con
 * Gemini, arma el objeto completo de la huella (con color,
 * brillo y zona ya calculados) y lo persiste.
 */
const crearHuella = async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ error: 'El campo texto es obligatorio.' });
    }

    const textoLimpio = texto.trim();

    if (textoLimpio.length === 0) {
      return res.status(400).json({ error: 'El texto no puede estar vacío.' });
    }

    if (textoLimpio.length > 1000) {
      return res.status(400).json({ error: 'Máximo 1000 caracteres.' });
    }

    // Clasificación por IA: categoría, emoción, intensidad y palabras clave.
    const analisis = await clasificarHuella(textoLimpio);
    const color = obtenerColor(analisis.emocion);

    const nuevaHuella = {
      id:           await getNextId(),
      texto:        textoLimpio,
      categoria:    analisis.categoria,
      emocion:      analisis.emocion,
      intensidad:   analisis.intensidad,
      palabrasClave: analisis.palabrasClave,
      color,
      brillo:       analisis.intensidad, // el brillo visual escala con la intensidad emocional
      zona:         obtenerZona(analisis.categoria),
      fecha:        new Date().toISOString(),
    };

    const huellaGuardada = await addHuella(nuevaHuella);
    return res.status(201).json(huellaGuardada);

  } catch (error) {
    console.error('❌ Error en crearHuella:', error.message);
    return res.status(500).json({
      error: 'Ocurrió un error al registrar la huella.',
      detalle: error.message,
    });
  }
};

/**
 * GET /api/huellas
 * ------------------------------------------------------------
 * Devuelve el listado completo de huellas tal cual está
 * persistido en el archivo JSON.
 */
const obtenerHuellas = async (req, res) => {
  try {
    const huellas = await readHuellas();
    return res.status(200).json(huellas);
  } catch (error) {
    console.error('❌ Error en obtenerHuellas:', error.message);
    return res.status(500).json({
      error: 'Ocurrió un error al obtener las huellas.',
      detalle: error.message,
    });
  }
};

/**
 * GET /api/constelacion
 * ------------------------------------------------------------
 * Construye el grafo que el frontend necesita para dibujar la
 * constelación:
 *   - nodes: una estrella por huella, con sus datos visuales.
 *   - links: una conexión por cada par de huellas que comparten
 *     al menos una palabra clave (comparación O(n²) sobre todas
 *     las huellas; suficiente para el volumen esperado de una
 *     instalación de arte).
 */
const obtenerConstelacion = async (req, res) => {
  try {
    const huellas = await readHuellas();

    const nodes = huellas.map((huella) => ({
      id:           huella.id,
      texto:        huella.texto,
      categoria:    huella.categoria,
      emocion:      huella.emocion,
      intensidad:   huella.intensidad,
      palabrasClave: huella.palabrasClave,
      color:        huella.color,
      brillo:       huella.brillo,
      zona:         huella.zona,
      fecha:        huella.fecha,
    }));

    // Compara cada par de huellas (i, j) una sola vez (j > i) para
    // detectar palabras clave compartidas y generar un link.
    const links = [];
    for (let i = 0; i < huellas.length; i++) {
      for (let j = i + 1; j < huellas.length; j++) {
        const palabras1 = huellas[i].palabrasClave || [];
        const palabras2 = huellas[j].palabrasClave || [];
        const coincidencias = palabras1.filter((p) => palabras2.includes(p));
        if (coincidencias.length > 0) {
          links.push({ source: huellas[i].id, target: huellas[j].id, coincidencias });
        }
      }
    }

    return res.status(200).json({ nodes, links });

  } catch (error) {
    console.error('❌ Error en obtenerConstelacion:', error.message);
    return res.status(500).json({
      error: 'Ocurrió un error al construir la constelación.',
      detalle: error.message,
    });
  }
};

module.exports = { crearHuella, obtenerHuellas, obtenerConstelacion };
