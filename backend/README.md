# 🌌 Constelación de Huellas — Backend

Backend REST en Node.js + Express para el proyecto universitario **"Constelación de Huellas"**.
Permite registrar huellas/recuerdos en texto, clasificarlas automáticamente con **IA generativa (OpenAI)**
en una categoría, asignarles un color y un tamaño de estrella, y exponer los datos necesarios para que un
frontend en React dibuje una constelación digital.

---

## 📁 Estructura del proyecto

```
backend/
│
├── data/
│   └── huellas.json          # Persistencia local (array de huellas)
│
├── routes/
│   └── huellas.routes.js     # Definición de endpoints REST
│
├── controllers/
│   └── huellas.controller.js # Lógica de negocio (clasificación, color, tamaño, constelación)
│
├── services/
│   └── openai.service.js     # Comunicación con la API de OpenAI
│
├── utils/
│   └── fileManager.js        # Lectura/escritura del archivo JSON
│
├── .env                       # Variables de entorno (NO subir a git)
├── .gitignore
├── server.js                  # Punto de entrada de la aplicación
├── package.json
└── README.md
```

---

## ⚙️ Requisitos previos

- Node.js >= 18
- Una API Key válida de OpenAI ([https://platform.openai.com/api-keys](https://platform.openai.com/api-keys))

---

## 🚀 Instalación paso a paso

### 1. Clonar / ubicarse en la carpeta `backend`

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- `express` — Framework web
- `cors` — Manejo de CORS para permitir peticiones desde React
- `dotenv` — Carga de variables de entorno
- `openai` — SDK oficial de OpenAI
- `nodemon` (dev) — Recarga automática en desarrollo

### 3. Configurar variables de entorno

Edita el archivo `.env` ubicado en la raíz de `backend/` con tus propios valores:

```env
PORT=4000
OPENAI_API_KEY=sk-tu-api-key-aqui
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Importante:** nunca subas tu `.env` real a un repositorio público. El `.gitignore` ya lo excluye.

### 4. Ejecutar el servidor

**Modo desarrollo** (con recarga automática usando nodemon):
```bash
npm run dev
```

**Modo producción / ejecución simple:**
```bash
npm start
```

Si todo está correcto, verás en consola:

```
🚀 Servidor corriendo en http://localhost:4000
```

### 5. Probar que el servidor está vivo

```bash
curl http://localhost:4000/
```

Respuesta esperada:
```json
{ "mensaje": "✨ API de Constelación de Huellas funcionando correctamente." }
```

---

## 📡 Endpoints disponibles

### 1️⃣ Registrar una huella

**`POST /api/huellas`**

**Body (JSON):**
```json
{
  "texto": "Mi mamá siempre me apoyó en mis estudios."
}
```

**Respuesta exitosa (201 Created):**
```json
{
  "id": 1,
  "texto": "Mi mamá siempre me apoyó en mis estudios.",
  "categoria": "Familia",
  "color": "#FFD700",
  "tamano": 2,
  "fecha": "2026-06-21T19:44:25.672Z"
}
```

**Errores posibles:**
- `400 Bad Request` — si el campo `texto` falta, está vacío o supera 1000 caracteres.
- `500 Internal Server Error` — si falla la clasificación con IA o el guardado en disco.

Ejemplo de error:
```json
{
  "error": "El campo \"texto\" es obligatorio y debe ser una cadena no vacía."
}
```

---

### 2️⃣ Obtener todas las huellas

**`GET /api/huellas`**

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "texto": "Mi mamá siempre me apoyó en mis estudios.",
    "categoria": "Familia",
    "color": "#FFD700",
    "tamano": 2,
    "fecha": "2026-06-21T19:44:25.672Z"
  },
  {
    "id": 2,
    "texto": "Mi mejor amigo estuvo conmigo en mis peores momentos.",
    "categoria": "Amigos",
    "color": "#4DA6FF",
    "tamano": 2,
    "fecha": "2026-06-21T19:50:10.120Z"
  }
]
```

---

### 3️⃣ Obtener datos para la constelación

**`GET /api/constelacion`**

Devuelve nodos (una huella = un nodo) y enlaces (links) entre huellas que comparten categoría.

**Respuesta (200 OK):**
```json
{
  "nodes": [
    {
      "id": 1,
      "texto": "Mi mamá siempre me apoyó en mis estudios.",
      "categoria": "Familia",
      "color": "#FFD700",
      "tamano": 2,
      "fecha": "2026-06-21T19:44:25.672Z"
    },
    {
      "id": 2,
      "texto": "Mi papá nunca dejó de creer en mí.",
      "categoria": "Familia",
      "color": "#FFD700",
      "tamano": 2,
      "fecha": "2026-06-21T19:50:10.120Z"
    }
  ],
  "links": [
    {
      "source": 1,
      "target": 2,
      "categoria": "Familia"
    }
  ]
}
```

---

## 🎨 Reglas de negocio

### Mapeo de colores por categoría

| Categoría             | Color     |
|------------------------|-----------|
| Familia                | `#FFD700` |
| Amigos                 | `#4DA6FF` |
| Amor                   | `#FF69B4` |
| Estudios               | `#FFFFFF` |
| Crecimiento Personal    | `#7CFC00` |

### Tamaño de la estrella (según cantidad de palabras)

| Longitud del texto         | Tamaño |
|------------------------------|--------|
| 1 a 10 palabras (corto)      | 2      |
| 11 a 25 palabras (medio)     | 4      |
| 26+ palabras (largo)         | 6      |

### Clasificación con IA

El servicio `services/openai.service.js` envía el texto al modelo configurado en `OPENAI_MODEL`
con un prompt que obliga a responder únicamente con una de las 5 categorías permitidas.
Si la IA devuelve algo inesperado, el sistema normaliza la respuesta y, como fallback,
asigna **"Crecimiento Personal"** para garantizar que la huella nunca quede sin categoría.

---

## 🧪 Probar rápidamente con cURL

```bash
# Registrar una huella
curl -X POST http://localhost:4000/api/huellas \
  -H "Content-Type: application/json" \
  -d '{"texto": "Mi mejor amigo estuvo conmigo en mis peores momentos."}'

# Obtener todas las huellas
curl http://localhost:4000/api/huellas

# Obtener datos de la constelación
curl http://localhost:4000/api/constelacion
```

---

## 🔗 Integración con el frontend (React + Vite)

El backend ya tiene CORS habilitado para el origen definido en `CORS_ORIGIN` (por defecto
`http://localhost:5173`, el puerto por defecto de Vite). Desde React solo necesitas hacer
peticiones `fetch`/`axios` a `http://localhost:4000/api/...`.

---

## 🛠️ Notas técnicas

- La persistencia es un archivo JSON plano (`data/huellas.json`), pensado para un proyecto
  académico. Puede migrarse a una base de datos (MongoDB, PostgreSQL, etc.) sin afectar
  las rutas ni controladores gracias a la separación en capas (`utils/fileManager.js` es la
  única pieza que conoce el almacenamiento).
- Toda la lógica de negocio está separada en capas: `routes` → `controllers` → `services`/`utils`.
- Manejo de errores centralizado en `server.js` y validaciones específicas en el controlador.
- Código 100% basado en `async/await`, sin callbacks anidados.
