# 🌌 Constelación de Huellas

Proyecto interactivo que transforma pensamientos, recuerdos y mensajes en una constelación visual de estrellas.  
Cada huella escrita por el usuario es analizada por inteligencia artificial y convertida en una estrella dentro de un universo simbólico.

---

## ✨ Descripción

“Constelación de Huellas” es una aplicación web donde el usuario escribe un texto y este es analizado por IA para identificar su contenido emocional o temático.

Cada huella se guarda y se transforma en una estrella dentro de una constelación, representando experiencias humanas como parte de un universo visual.

---

## 🚀 Funcionalidades

- Registro de huellas de texto
- Clasificación automática con inteligencia artificial (Gemini)
- Detección de categoría emocional o temática
- Asignación de color según categoría
- Tamaño dinámico según intensidad del mensaje
- Guardado de datos en JSON
- Visualización tipo galaxia / constelación en el frontend
- Interacción en tiempo real entre usuario y universo

---

## 🧠 Cómo funciona

1. El usuario escribe una huella (texto)
2. Se envía al backend mediante una API
3. La IA analiza el contenido
4. Se asigna:
   - Categoría (Familia, Amigos, Amor, Estudios, Crecimiento Personal)
   - Emoción
   - Intensidad
5. Se guarda como una estrella
6. El frontend lo representa visualmente en la constelación

---

## 🖥️ Frontend

El frontend es la interfaz visual del proyecto, donde el usuario interactúa directamente con el universo.

Características:

- Diseño tipo universo oscuro / galaxia
- Campo de texto central para escribir huellas
- Botón de envío para generar estrellas
- Animaciones de estrellas en pantalla
- Visualización dinámica de la constelación
- Estética minimalista y poética

Comunicación con backend:

- POST /api/huellas → envía la huella del usuario
- GET /api/huellas → obtiene todas las huellas
- GET /api/constelacion → obtiene datos para el universo

---

## 🗂️ Estructura del proyecto

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

frontend/
├── index.html
├── style.css
├── script.js
└── assets/

---

## 🛠️ Tecnologías usadas

- Node.js
- Express
- Google Gemini AI
- CORS
- dotenv
- File System (JSON)
- HTML
- CSS
- JavaScript (Vanilla)

---

## ⚙️ Instalación

npm install

---

## ▶️ Ejecución del proyecto

npm run dev

Servidor:
http://localhost:4000

---

## 📡 Endpoints

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

## 🧠 Inteligencia artificial

El sistema utiliza IA para analizar el texto del usuario y clasificarlo en una categoría emocional o temática.

Esto define:
- Color de la estrella
- Tamaño (intensidad)
- Representación en el universo

---

## 🌠 Idea del proyecto

Cada huella representa una experiencia humana.

Esa experiencia se convierte en una estrella, y todas juntas forman una constelación de recuerdos, emociones y vínculos.

---

## 🔐 Variables de entorno

GEMINI_API_KEY=tu_api_key
PORT=4000

---

## 🔮 Futuras mejoras

- Conexión entre estrellas similares
- Animaciones avanzadas
- Base de datos real
- Interacción entre huellas

---

## 👨‍💻 Autor

Proyecto académico de arte digital, inteligencia artificial y visualización de datos.