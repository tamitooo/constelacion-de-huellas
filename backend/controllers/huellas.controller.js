/**
 * controllers/huellas.controller.js
 * --------------------------------------------------------
 * Controlador de huellas para Constelación de Huellas.
 * La IA devuelve:
 * - categoría
 * - emoción
 * - intensidad
 * - palabras clave
 *
 * La categoría define la zona de la galaxia.
 * La emoción define el color.
 * La intensidad define el brillo.
 * --------------------------------------------------------
 */

const { clasificarHuella } = require('../services/gemini.service');

const {
  readHuellas,
  addHuella,
  getNextId,
} = require('../utils/fileManager');

// Colores según emoción
const COLORES_POR_EMOCION = {
  Alegría: '#FFD700',
  Nostalgia: '#7B68EE',
  Gratitud: '#7CFC00',
  Tristeza: '#4682B4',
  Esperanza: '#FFFFFF',
  Neutral: '#CCCCCC',
};

const obtenerColor = (emocion) => {
  return COLORES_POR_EMOCION[emocion] || '#CCCCCC';
};

const obtenerZona = (categoria) => {
  const zonas = {
    Familia: 'Oeste',
    Amigos: 'Este',
    Amor: 'Sur',
    Estudios: 'Norte',
    'Crecimiento Personal': 'Centro',
  };

  return zonas[categoria] || 'Centro';
};

/**
 * POST /api/huellas
 */
const crearHuella = async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({
        error: 'El campo texto es obligatorio.',
      });
    }

    const textoLimpio = texto.trim();

    if (textoLimpio.length === 0) {
      return res.status(400).json({
        error: 'El texto no puede estar vacío.',
      });
    }

    if (textoLimpio.length > 1000) {
      return res.status(400).json({
        error: 'Máximo 1000 caracteres.',
      });
    }

    // IA
    const analisis = await clasificarHuella(textoLimpio);

    const color = obtenerColor(analisis.emocion);

    const nuevaHuella = {
      id: await getNextId(),

      texto: textoLimpio,

      categoria: analisis.categoria,
      emocion: analisis.emocion,
      intensidad: analisis.intensidad,
      palabrasClave: analisis.palabrasClave,

      color,

      brillo: analisis.intensidad,

      zona: obtenerZona(analisis.categoria),

      fecha: new Date().toISOString(),
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
 */
const obtenerConstelacion = async (req, res) => {
  try {
    const huellas = await readHuellas();

    const nodes = huellas.map((huella) => ({
      id: huella.id,
      texto: huella.texto,

      categoria: huella.categoria,
      emocion: huella.emocion,
      intensidad: huella.intensidad,
      palabrasClave: huella.palabrasClave,

      color: huella.color,
      brillo: huella.brillo,
      zona: huella.zona,

      fecha: huella.fecha,
    }));

    const links = [];

    for (let i = 0; i < huellas.length; i++) {
      for (let j = i + 1; j < huellas.length; j++) {
        const palabras1 = huellas[i].palabrasClave || [];
        const palabras2 = huellas[j].palabrasClave || [];

        const coincidencias = palabras1.filter((palabra) =>
          palabras2.includes(palabra)
        );

        if (coincidencias.length > 0) {
          links.push({
            source: huellas[i].id,
            target: huellas[j].id,
            coincidencias,
          });
        }
      }
    }

    return res.status(200).json({
      nodes,
      links,
    });
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