/**
 * controllers/huellas.controller.js
 * --------------------------------------------------------
 * Controlador que contiene la lógica de negocio relacionada
 * con las huellas: validación, clasificación, asignación de
 * atributos visuales (color/tamaño) y construcción de la
 * estructura de datos de la constelación.
 * --------------------------------------------------------
 */

const { clasificarHuella } = require('../services/gemini.service');
const {
  readHuellas,
  addHuella,
  getNextId,
} = require('../utils/fileManager');

// Mapeo de color según la categoría asignada por la IA
const COLORES_POR_CATEGORIA = {
  Familia: '#FFD700',
  Amigos: '#4DA6FF',
  Amor: '#FF69B4',
  Estudios: '#FFFFFF',
  'Crecimiento Personal': '#7CFC00',
};

/**
 * Calcula el tamaño de la estrella en función de la
 * cantidad de palabras del texto.
 * @param {string} texto
 * @returns {number} Tamaño de la estrella (2, 4 o 6).
 */
const calcularTamano = (texto) => {
  const cantidadPalabras = texto
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0).length;

  if (cantidadPalabras <= 10) return 2;
  if (cantidadPalabras <= 25) return 4;
  return 6;
};

/**
 * Obtiene el color correspondiente a una categoría.
 * Si la categoría no está mapeada, retorna un color neutro.
 * @param {string} categoria
 * @returns {string} Código hexadecimal del color.
 */
const obtenerColor = (categoria) => {
  return COLORES_POR_CATEGORIA[categoria] || '#CCCCCC';
};

/**
 * POST /api/huellas
 * Registra una nueva huella: la clasifica con IA, calcula
 * sus atributos visuales y la persiste en el archivo JSON.
 */
const crearHuella = async (req, res) => {
  try {
    const { texto } = req.body;

    // --- Validación de entrada ---
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
      return res.status(400).json({
        error: 'El campo "texto" es obligatorio y debe ser una cadena no vacía.',
      });
    }

    if (texto.trim().length > 1000) {
      return res.status(400).json({
        error: 'El texto es demasiado largo. Máximo 1000 caracteres.',
      });
    }

    const textoLimpio = texto.trim();

    // 1. Clasificar el texto utilizando IA
    const categoria = await clasificarHuella(textoLimpio);

    // 2. Asignar color según la categoría
    const color = obtenerColor(categoria);

    // 3. Calcular el tamaño de la estrella según el largo del texto
    const tamano = calcularTamano(textoLimpio);

    // 4. Construir el objeto huella
    const nuevaHuella = {
      id: await getNextId(),
      texto: textoLimpio,
      categoria,
      color,
      tamano,
      fecha: new Date().toISOString(),
    };

    // 5. Persistir en el archivo JSON
    const huellaGuardada = await addHuella(nuevaHuella);

    // 6. Responder con el objeto creado
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
 * Retorna todas las huellas almacenadas.
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
 * Construye y retorna la estructura de nodos y enlaces (links)
 * que el frontend usará para dibujar la constelación.
 *
 * Reglas:
 * - Cada huella se transforma en un nodo.
 * - Dos nodos se conectan (link) si comparten la misma categoría.
 */
const obtenerConstelacion = async (req, res) => {
  try {
    const huellas = await readHuellas();

    // Cada huella se convierte en un nodo de la constelación
    const nodes = huellas.map((huella) => ({
      id: huella.id,
      texto: huella.texto,
      categoria: huella.categoria,
      color: huella.color,
      tamano: huella.tamano,
      fecha: huella.fecha,
    }));

    // Generamos los enlaces entre nodos de la misma categoría
    const links = [];

    for (let i = 0; i < huellas.length; i++) {
      for (let j = i + 1; j < huellas.length; j++) {
        if (huellas[i].categoria === huellas[j].categoria) {
          links.push({
            source: huellas[i].id,
            target: huellas[j].id,
            categoria: huellas[i].categoria,
          });
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

module.exports = {
  crearHuella,
  obtenerHuellas,
  obtenerConstelacion,
};
