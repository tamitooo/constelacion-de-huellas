if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️ CRÍTICO: La variable GEMINI_API_KEY no está definida.");
}

const CATEGORIAS = [
  "Familia",
  "Amigos",
  "Amor",
  "Estudios",
  "Crecimiento Personal",
];

const clasificarHuella = async (texto) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Endpoint oficial actualizado (v1) que reemplaza al viejo v1beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Analiza el siguiente texto para la obra interactiva "Constelación de Huellas".

Devuelve EXCLUSIVAMENTE un JSON válido.

Categorías permitidas:
- Familia
- Amigos
- Amor
- Estudios
- Crecimiento Personal

Emociones permitidas:
- Alegría
- Nostalgia
- Gratitud
- Tristeza
- Esperanza
- Neutral

Formato obligatorio:

{
  "categoria": "Familia",
  "emocion": "Gratitud",
  "intensidad": 3,
  "palabrasClave": ["hogar","mamá","apoyo"]
}

Reglas:
- categoria debe ser exactamente una de las categorías permitidas.
- emocion debe ser exactamente una de las emociones permitidas.
- intensidad debe ser un número entero entre 1 y 5.
- palabrasClave debe contener máximo 3 palabras.
- No escribas explicaciones.
- No uses markdown.
- No uses bloques de código.
- Devuelve únicamente JSON.

Texto:
"${texto}"
`;

    // Petición HTTP directa
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    
    // Extraemos el texto de la respuesta estructurada de Google
    const textResponse = data.candidates[0].content.parts[0].text.trim();

    console.log("Gemini respondió:");
    console.log(textResponse);

    const limpio = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const resultado = JSON.parse(limpio);

    return {
      categoria: resultado.categoria || "Crecimiento Personal",
      emocion: resultado.emocion || "Esperanza",
      intensidad: resultado.intensidad || 2,
      palabrasClave: resultado.palabrasClave || []
    };

  } catch (error) {
    console.error("====== ERROR EN CLASIFICAR HUELLA (FETCH) ======");
    console.error(error.message);
    console.error("================================================");
    
    return {
      categoria: "Crecimiento Personal",
      emocion: "Esperanza",
      intensidad: 2,
      palabrasClave: []
    };
  }
};

module.exports = { clasificarHuella };