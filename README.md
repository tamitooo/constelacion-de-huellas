# ✧ Constelación de Huellas

> *"La huella representa la permanencia de aquello ausente que continúa influyendo en el presente, configurando nuestra identidad a través de la memoria, la experiencia y la relación con los otros."*

**Constelación de Huellas** es una instalación interactiva de arte digital generativo que transforma recuerdos anónimos, escritos por los visitantes, en estrellas que se integran a una constelación colectiva en constante crecimiento.

---

## 🌌 Concepto y motivación

Elegimos el concepto de **huella** porque todas las experiencias, personas y acontecimientos dejan marcas que influyen en nuestra identidad. Aunque su origen ya no esté presente, sus efectos permanecen en la memoria y continúan formando parte de quienes somos.

La obra combina:

- Un **elemento físico**: un jarrón transparente con estrellas de papel que contienen huellas anónimas, sobre una mesa de interacción.
- Una **visualización digital dinámica**: una pantalla que transforma las experiencias escritas por los participantes en cuerpos celestes (estrellas) que forman una constelación colectiva en tiempo real.

## 🧭 Flujo de experiencia

1. **Jarrón de estrellas** — el visitante toma una estrella de papel del jarrón.
2. **Lee una huella anónima** — descubre una huella escrita por otra persona.
3. **Reflexión** — se invita a pensar: *"¿Qué huella permanece contigo?"*
4. **Participación** — el visitante escribe su propia huella de forma anónima en la pantalla.
5. **Transformación** — el sistema interpreta la huella (vía IA) y la convierte en un elemento visual único: una nueva estrella con color, brillo, categoría y emoción propios.
6. **Universo en expansión** — la nueva huella se integra al universo colectivo, que crece con cada participante.

## ⚙️ Diagrama de funcionamiento

```
Visitante → escribe una huella → el sistema la clasifica
   (categoría + emoción, vía Gemini)
        ↓
Se genera un elemento visual (estrella, con color/brillo según
   la clasificación)
        ↓
La huella se guarda en la base de datos (archivo JSON)
        ↓
El universo digital se actualiza en tiempo real
        ↓
La obra evoluciona con cada nueva huella (nuevas conexiones
   entre estrellas relacionadas)
```

## 🏗️ Arquitectura técnica

El proyecto está dividido en dos partes independientes:

| Capa | Stack |
|---|---|
| **Frontend** | JavaScript vanilla (ES Modules), Canvas API, CSS puro, pixel art hecho a mano |
| **Backend** | Node.js + Express |
| **Persistencia** | Archivo JSON (`backend/data/huellas.json`) — sin base de datos externa |
| **Clasificación de texto** | Google **Gemini** (`gemini-2.5-flash`) vía API REST |

No se usa ningún framework de frontend (React, Vue, etc.): todo el universo, la cámara, las animaciones y las conexiones están hechos con JS y CSS puros, priorizando control total sobre el rendimiento y la estética pixel art.

## 📁 Estructura del proyecto

```
constelacion-de-huellas/
├── backend/
│   ├── controllers/
│   │   └── huellas.controller.js   # Lógica de cada endpoint (crear, listar, construir constelación)
│   ├── routes/
│   │   └── huellas.routes.js       # Definición de rutas REST (/api/huellas, /api/constelacion)
│   ├── services/
│   │   └── gemini.service.js       # Comunicación con la API de Gemini (clasificación de texto)
│   ├── utils/
│   │   └── fileManager.js          # Lectura/escritura del archivo JSON de persistencia
│   ├── data/
│   │   └── huellas.json            # (se genera automáticamente) — huellas guardadas
│   ├── server.js                   # Punto de entrada del backend (Express)
│   ├── package.json
│   └── .env.example                # Variables de entorno necesarias (GEMINI_API_KEY, PORT)
│
├── frontend/
│   ├── index.html                  # Esqueleto de la página (formulario, universo, controles)
│   ├── style.css                   # Todos los estilos: universo, estrellas, formulario, UI flotante
│   ├── main.js                     # Punto de entrada: cablea referencias DOM y arranca el loop principal
│   ├── config.js                   # Constantes globales (colores, zonas, tiempos, parámetros de conexión)
│   ├── api.js                      # Comunicación con el backend (fetch con timeout + fallback offline)
│   ├── camera.js                   # Pan y zoom del universo (mouse, trackpad, touch, botones)
│   ├── estrellas.js                # Creación, posicionamiento y pintado de estrellas (DOM + pixel art)
│   ├── conexiones.js               # Motor de puntaje + dibujo de las líneas entre estrellas relacionadas
│   ├── animacion-estrella.js       # Animación de "nacimiento" de una estrella nueva (zoom→corazón→vuelo→aterrizaje)
│   └── ui.js                       # Orquesta el flujo de envío del formulario (procesando → resultado → exploración)
│
└── README.md
```

## 🧠 Clasificación con IA (Gemini)

Cada huella enviada por un visitante se manda a Gemini (`gemini-2.5-flash`) con un prompt estricto que le pide devolver **solo JSON** con:

- **`categoria`** — una de 5 categorías poéticas:
  - Familia y Raíces
  - Amistad y Complicidad
  - Amor y Desamor
  - Aprendizaje y Transformación
  - Pérdida y Ausencia
- **`emocion`** — una de 10 emociones (Amor, Alegría, Empatía, Gratitud, Tristeza, Nostalgia, Resiliencia, Transformación, Ira, Neutral), cada una con un color hex asociado.
- **`intensidad`** — entero de 1 a 5 (define el tamaño y brillo de la estrella).
- **`palabrasClave`** — hasta 3 palabras clave, usadas luego para calcular conexiones entre huellas.

Si Gemini falla por cualquier motivo (red, respuesta inválida, etc.), el backend **nunca rompe la experiencia**: devuelve una clasificación neutra por defecto para que la huella se guarde igual.

## 🔗 Motor de conexiones

Cada par de estrellas recibe un puntaje según 4 criterios (parámetros en `frontend/config.js`):

1. Comparten **categoría**.
2. Comparten **emoción**.
3. Comparten al menos **2 palabras clave**.
4. Están **cerca** físicamente en el lienzo.

Si el puntaje supera un umbral mínimo, se genera una conexión visual (línea con degradado). Cada estrella tiene un máximo de conexiones simultáneas, para que la constelación no se vuelva un enredo visual ilegible.

## ✨ Animación de nacimiento de una estrella

Cuando el visitante envía su huella, la nueva estrella no aparece de golpe: pasa por una secuencia de 4 fases (`animacion-estrella.js`), pensada específicamente para el contexto de instalación:

1. **Zoom in** — aparece pequeña y crece en el centro de la pantalla.
2. **Corazón** — recorre la silueta de un corazón dejando una estela tipo cometa.
3. **Vuelo** — viaja desde el centro hasta su posición final en el universo.
4. **Aterrizaje** — destello + anillos de píxeles expansivos, y la estrella se asienta definitivamente.

## 🚀 Puesta en marcha

### Backend

```bash
cd backend
cp .env.example .env      # completar GEMINI_API_KEY
npm install
npm start                 # levanta el servidor en http://localhost:4000
```

### Frontend

El frontend es HTML/CSS/JS puro (ES Modules), no requiere build. Basta con servirlo con cualquier servidor estático, por ejemplo:

```bash
cd frontend
npx serve .
# o, con la extensión Live Server de VSCode, abrir index.html
```

Asegúrate de que `API_BASE` en `frontend/config.js` apunte a la URL real del backend (por defecto `http://localhost:4000/api`).

## 👥 Equipo

| Integrante | Rol |
|---|---|
| **Tamy** | Programación e interacción |
| **Hadde** | Materiales y organización |
| **Alex** | Concepto y experiencia del público |
| **Mariel** | Investigación y diseño |

## 🗺️ Planificación del trabajo

1. Diseño conceptual y visual.
2. Diseño de estrellas físicas.
3. Desarrollo de la visualización digital.
4. Integración de la interacción del público.
5. Pruebas y ajustes.
6. Montaje y presentación.
