if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️ CRÍTICO: La variable GEMINI_API_KEY no está definida.');
}

const clasificarHuella = async (texto) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

    const limpio = textResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const resultado = JSON.parse(limpio);

    return {
      categoria:    resultado.categoria    || 'Aprendizaje y Transformación',
      emocion:      resultado.emocion      || 'Neutral',
      intensidad:   resultado.intensidad   || 2,
      palabrasClave: resultado.palabrasClave || [],
    };

  } catch (error) {
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