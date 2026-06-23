// estrellas.js
import { ZONA_OFFSET, DISPERSION } from './config.js';

let capaEstrellas = null;
let estrellas = [];

// Intentos máximos para encontrar una posición sin colisión
// antes de aceptar una posición aleatoria como último recurso.
const INTENTOS_POSICION = 20;

export function setCapaEstrellas(el) { capaEstrellas = el; }
export function getEstrellas() { return estrellas; }

export function posicionPorCategoria(categoria, tamanoNueva) {
  const offset = ZONA_OFFSET[categoria] || { dx: 0, dy: 0 };
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let intento = 0; intento < INTENTOS_POSICION; intento++) {
    const x = cx + offset.dx + (Math.random() - 0.5) * DISPERSION;
    const y = cy + offset.dy + (Math.random() - 0.5) * DISPERSION;

    const hayColision = estrellas.some(estrella => {
      const dx = x - estrella.x;
      const dy = y - estrella.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radioMin = (estrella.tamano / 2 + tamanoNueva / 2) + 20;
      return dist < radioMin;
    });

    if (!hayColision) return { x, y };
  }

  // Última instancia: no se encontró hueco libre tras varios intentos.
  // Se acepta una posición aproximada para no bloquear el flujo.
  console.warn(`No se encontró posición libre para una estrella de categoría "${categoria}" tras ${INTENTOS_POSICION} intentos. Puede quedar superpuesta.`);
  return {
    x: cx + offset.dx + (Math.random() - 0.5) * DISPERSION,
    y: cy + offset.dy + (Math.random() - 0.5) * DISPERSION,
  };
}

/**
 * Genera el patrón geométrico de píxeles que forma la silueta de una
 * estrella de 4 puntas. Se usa tanto para estrellas definitivas (DOM)
 * como para la estrella temporal de la animación de envío, para no
 * mantener dos copias del mismo cálculo.
 *
 * Cada entrada es [offsetX, offsetY, brillo] en unidades de "pixel".
 */
function generarPatronEstrella() {
  const pattern = [];

  // Brazos horizontal y vertical
  for (let i = -8; i <= 8; i++) {
    const brillo = 8 - Math.floor(Math.abs(i) * 0.8);
    pattern.push([i, 0, brillo]);
    pattern.push([0, i, brillo]);
  }

  // Brazos diagonales, más cortos
  for (let d = 1; d <= 4; d++) {
    const brillo = 5 - d;
    pattern.push([d, d, brillo], [-d, d, brillo], [d, -d, brillo], [-d, -d, brillo]);
  }

  // Núcleo central, el punto más brillante
  pattern.push([0, 0, 8]);

  return pattern;
}

/**
 * Crea los elementos DOM de los píxeles de una estrella sobre un
 * contenedor ya posicionado, aplicando color y brillo según intensidad.
 * Devuelve la lista de píxeles creados (útil para animarlos después).
 */
function pintarPixelesEstrella(contenedor, color, intensidad) {
  const tamano = contenedor._tamanoBase;
  const pixelSize = Math.max(2, tamano / 12);
  const factorBrillo = Math.pow(intensidad / 5, 1.8);
  const pixeles = [];

  generarPatronEstrella().forEach(([px, py, brillo]) => {
    const pixel = document.createElement('div');
    const blur1 = pixelSize * 2 * factorBrillo;
    const blur2 = pixelSize * 5 * factorBrillo;
    pixel.style.cssText = `
      position: absolute;
      width:  ${pixelSize}px;
      height: ${pixelSize}px;
      left:   calc(50% + ${px * pixelSize}px - ${pixelSize / 2}px);
      top:    calc(50% + ${py * pixelSize}px - ${pixelSize / 2}px);
      background: ${color};
      opacity: ${brillo / 8};
      box-shadow: 0 0 ${blur1}px ${color}, 0 0 ${blur2}px ${color};
      transition: background 0.2s, box-shadow 0.2s;
    `;
    contenedor.appendChild(pixel);
    pixeles.push(pixel);
  });

  return pixeles;
}

export function crearEstrellaDOM(datos) {
  const { x, y, color, tamano, categoria, emocion, intensidad } = datos;

  const contenedor = document.createElement('div');
  contenedor.className = 'estrella-dom';
  contenedor.style.left = x + 'px';
  contenedor.style.top = y + 'px';
  contenedor.style.width = tamano + 'px';
  contenedor.style.height = tamano + 'px';
  contenedor._tamanoBase = tamano;

  pintarPixelesEstrella(contenedor, color, intensidad || 1);

  contenedor.dataset.categoria = categoria;
  contenedor.dataset.emocion = emocion || '';

  return contenedor;
}

export function crearEstrellaTemporal(colorInicial = '#FFD700', intensidadInicial = 3) {
  const contenedorGiro = document.createElement('div');
  contenedorGiro.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    animation: spin 3s linear infinite;
  `;

  const tamano = intensidadInicial * 12 + 10;
  const estrellaDiv = document.createElement('div');
  estrellaDiv.style.cssText = `position: relative; width: ${tamano}px; height: ${tamano}px;`;
  estrellaDiv._tamanoBase = tamano;

  const pixels = pintarPixelesEstrella(estrellaDiv, colorInicial, intensidadInicial);
  const pixelSize = Math.max(2, tamano / 12);

  contenedorGiro.appendChild(estrellaDiv);

  return { element: contenedorGiro, pixels, pixelSize };
}

export function anadirEstrella(datosBackend, callbackRecalcular) {
  const tamano = (datosBackend.intensidad || 3) * 10 + 6;
  const pos = posicionPorCategoria(datosBackend.categoria, tamano);

  const estrella = {
    id: datosBackend.id || Date.now(),
    x: pos.x,
    y: pos.y,
    color: datosBackend.color || '#ffd700',
    tamano,
    categoria: datosBackend.categoria || 'Huella',
    emocion: datosBackend.emocion || '',
    palabrasClave: datosBackend.palabrasClave || [],
    intensidad: datosBackend.intensidad || 3,
  };

  estrellas.push(estrella);
  const el = crearEstrellaDOM(estrella);
  capaEstrellas.appendChild(el);

  if (callbackRecalcular) callbackRecalcular();

  return estrella;
}