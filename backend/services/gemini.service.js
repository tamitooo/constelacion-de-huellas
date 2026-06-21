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
Eres un clasificador para la instalación interactiva "Constelación de Huellas".
Tu única tarea es analizar el texto de un visitante y clasificarlo en una (1) de estas categorías exactas:
Familia
Amigos
Amor
Estudios
Crecimiento Personal

REGLAS OBLIGATORIAS:
- Responde únicamente con el nombre de la categoría elegida, idéntica a la lista.
- No agregues puntuación, explicaciones, ni texto adicional.

Texto del visitante: "${texto}"
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

    // Normalizar para comparar de forma segura
    const normalizar = (txt) =>
      txt
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z ]/g, "")
        .trim();

    const encontrado = CATEGORIAS.find(
      (c) => normalizar(c) === normalizar(textResponse)
    );

    if (encontrado) {
      return encontrado;
    }

    console.log(`[Gemini API] Respuesta inesperada: "${textResponse}". Usando por defecto.`);
    return "Crecimiento Personal";

  } catch (error) {
    console.error("====== ERROR EN CLASIFICAR HUELLA (FETCH) ======");
    console.error(error.message);
    console.error("================================================");
    
    return "Crecimiento Personal";
  }
};

module.exports = { clasificarHuella };