# Constelación de Huellas

Proyecto interactivo que transforma pensamientos, recuerdos y mensajes en una constelación visual de estrellas. Cada huella escrita por el usuario es analizada por inteligencia artificial y convertida en una estrella dentro del universo.

---

## Descripción

Constelación de Huellas es una aplicación web donde el usuario escribe un texto y este es clasificado automáticamente por IA en una categoría temática o emocional. Luego, cada huella se guarda y puede representarse como parte de una constelación.

---

## Funcionalidades

- Registro de huellas de texto
- Clasificación automática con IA
- Categorías: Familia, Amigos, Amor, Estudios, Crecimiento Personal
- Asignación de color según categoría
- Tamaño dinámico según intensidad
- Guardado en archivo JSON
- Base lista para visualización tipo galaxia o constelación

---

## Estructura del proyecto

backend/
├── server.js
├── routes/
│   └── huellas.routes.js
├── controllers/
│   └── huellas.controller.js
├── services/
│   └── gemini.service.js
├── utils/
│   └── fileManager.js
├── data/
│   └── huellas.json
└── .env

---

## Tecnologías usadas

- Node.js
- Express
- Google Gemini AI
- CORS
- dotenv
- File System (JSON)

---

## Instalación

npm install

---

## Ejecutar el proyecto

npm run dev

Servidor:
http://localhost:4000

---

## Endpoints

POST /api/huellas

Body:
{
  "texto": "mi familia me apoya mucho"
}

---

GET /api/huellas

---

GET /api/constelacion

---

## Inteligencia artificial

El sistema usa IA para analizar el texto del usuario y clasificarlo en una categoría. Esa categoría define el color, el tamaño y cómo se representa la huella en la constelación.

---

## Idea del proyecto

Cada huella representa una experiencia humana. Esa experiencia se convierte en una estrella. Todas las estrellas juntas forman una constelación de recuerdos, emociones y vínculos.

---

## Variables de entorno

GEMINI_API_KEY=tu_api_key
PORT=4000


---

## Futuras mejoras

- Visualización interactiva del universo
- Conexiones entre estrellas similares
- Animaciones avanzadas
- Base de datos
- Interfaz tipo galaxia

---

## Autor

Proyecto académico de arte digital, inteligencia artificial y visualización de datos.