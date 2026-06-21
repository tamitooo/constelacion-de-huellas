/**
 * utils/fileManager.js
 * --------------------------------------------------------
 * Utilidad encargada de toda la persistencia en archivo JSON.
 * Centraliza las operaciones de lectura y escritura para que
 * el resto de la aplicación no tenga que conocer detalles
 * del sistema de archivos (separación de responsabilidades).
 * --------------------------------------------------------
 */

const fs = require('fs/promises');
const path = require('path');

// Ruta absoluta al archivo de persistencia
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'huellas.json');

/**
 * Asegura que el archivo de datos exista.
 * Si no existe, lo crea con un arreglo vacío.
 */
const ensureFileExists = async () => {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch (error) {
    // El archivo no existe -> lo creamos con un array vacío
    await fs.writeFile(DATA_FILE_PATH, '[]', 'utf-8');
  }
};

/**
 * Lee y parsea el archivo huellas.json.
 * @returns {Promise<Array>} Arreglo de huellas almacenadas.
 */
const readHuellas = async () => {
  await ensureFileExists();

  try {
    const contenido = await fs.readFile(DATA_FILE_PATH, 'utf-8');

    // Si el archivo está vacío, retornamos un arreglo vacío
    if (!contenido || contenido.trim() === '') {
      return [];
    }

    return JSON.parse(contenido);
  } catch (error) {
    console.error('❌ Error al leer huellas.json:', error.message);
    throw new Error('No se pudo leer el archivo de huellas.');
  }
};

/**
 * Sobrescribe el archivo huellas.json con el arreglo proporcionado.
 * @param {Array} huellas - Arreglo completo de huellas a persistir.
 */
const writeHuellas = async (huellas) => {
  try {
    const data = JSON.stringify(huellas, null, 2);
    await fs.writeFile(DATA_FILE_PATH, data, 'utf-8');
  } catch (error) {
    console.error('❌ Error al escribir huellas.json:', error.message);
    throw new Error('No se pudo guardar la huella en el archivo.');
  }
};

/**
 * Agrega una nueva huella al archivo y la retorna.
 * @param {Object} nuevaHuella - Huella ya construida (con id, color, etc.)
 * @returns {Promise<Object>} La huella creada.
 */
const addHuella = async (nuevaHuella) => {
  const huellas = await readHuellas();
  huellas.push(nuevaHuella);
  await writeHuellas(huellas);
  return nuevaHuella;
};

/**
 * Genera el siguiente ID autoincremental en base a las huellas existentes.
 * @returns {Promise<number>} Próximo ID disponible.
 */
const getNextId = async () => {
  const huellas = await readHuellas();
  if (huellas.length === 0) return 1;

  const maxId = huellas.reduce((max, huella) => {
    return huella.id > max ? huella.id : max;
  }, 0);

  return maxId + 1;
};

module.exports = {
  readHuellas,
  writeHuellas,
  addHuella,
  getNextId,
};
