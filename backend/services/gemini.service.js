/**
 * ============================================================
 *  services/gemini.service.js
 * ============================================================
 *  Encapsula toda la comunicación con la API de Gemini (Google
 *  Generative Language API). Es la única pieza del backend que
 *  "entiende" el texto de una huella: le pide al modelo que la
 *  clasifique según las reglas del proyecto y devuelve un
 *  objeto ya validado y con valores por defecto seguros.
 *
 *  Función principal: clasificarHuella(texto)
 *  ------------------------------------------------------------
 *  1. Arma un prompt estricto que le indica a Gemini:
 *       - las 5 categorías poéticas permitidas,
 *       - las 10 emociones permitidas,
 *       - el formato JSON exacto que debe devolver,
 *       - reglas de longitud e intensidad (1-5).
 *  2. Llama al endpoint generateContent del modelo
 *     gemini-2.5-flash con ese prompt.
 *  3. Limpia la respuesta (por si Gemini agrega bloques
 *     markdown ```json) y la parsea como JSON.
 *  4. Si todo sale bien, devuelve { categoria, emocion,
 *     intensidad, palabrasClave }.
 *  5. Si algo falla (red, JSON inválido, respuesta inesperada
 *     de la API), NO lanza el error hacia arriba: devuelve un
 *     resultado neutro por defecto para que la app nunca se
 *     rompa por una falla de la IA, y solo lo deja registrado
 *     en consola para debugging.
 * ============================================================
 */

if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️ CRÍTICO: La variable GEMINI_API_KEY no está definida.');
}

const clasificarHuella = async (texto) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Prompt estricto: le pedimos a Gemini que devuelva SOLO JSON,
    // usando exactamente las categorías/emociones definidas para
    // el proyecto (deben coincidir con COLORES_POR_EMOCION del
    // controlador y con ZONA_OFFSET / COLOR_EMOCION del frontend).
    const prompt = `
Analiza el siguiente texto para la obra interactiva "Constelación de Huellas".

Devuelve EXCLUSIVAMENTE un JSON válido.

Categorías permitidas (úsalas exactamente como están escritas):
- Familia y Raíces
- Amistad y Complicidad
- Pérdida y Ausencia
- Aprendizaje y Transformación
- Amor y Desamor

Emociones permitidas (úsalas exactamente como están escritas):
- Amor
- Alegría
- Empatía
- Gratitud
- Tristeza
- Nostalgia
- Resiliencia
- Transformación
- Ira
- Neutral

Formato obligatorio:

{
  "categoria": "Familia y Raíces",
  "emocion": "Gratitud",
  "intensidad": 4,
  "palabrasClave": ["hogar","abuela","enseñanzas"]
}

Reglas:
- categoria debe ser exactamente una de las categorías permitidas.
- emocion debe ser exactamente una de las emociones permitidas.
- intensidad debe ser un número entero entre 1 y 5.
- palabrasClave debe contener máximo 3 palabras clave (sustantivos o conceptos, sin artículos ni preposiciones).
- No escribas explicaciones.
- No uses markdown.
- No uses bloques de código.
- Devuelve únicamente JSON.

Texto:
"${texto}"
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text.trim();

    console.log('Gemini respondió:');
    console.log(textResponse);

    // Gemini a veces envuelve el JSON en ```json ... ``` a pesar de
    // que se le pidió no hacerlo; lo limpiamos por seguridad antes
    // de parsear.
    const limpio = textResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const resultado = JSON.parse(limpio);

    // Valores por defecto adicionales por si Gemini omite algún
    // campo (defensa extra además del try/catch general).
    return {
      categoria:    resultado.categoria    || 'Aprendizaje y Transformación',
      emocion:      resultado.emocion      || 'Neutral',
      intensidad:   resultado.intensidad   || 2,
      palabrasClave: resultado.palabrasClave || [],
    };

  } catch (error) {
    // Cualquier falla (de red, de parseo, de la API) cae aquí.
    // En vez de romper la petición del usuario, devolvemos una
    // clasificación neutra: la huella igual se guarda y se
    // convierte en estrella, solo que sin etiqueta específica.
    console.error('====== ERROR EN CLASIFICAR HUELLA ======');
    console.error(error.message);
    console.error('========================================');

    return {
      categoria:    'Aprendizaje y Transformación',
      emocion:      'Neutral',
      intensidad:   2,
      palabrasClave: [],
    };
  }
};

module.exports = { clasificarHuella };
