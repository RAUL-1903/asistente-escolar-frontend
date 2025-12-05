# GUIA COMPLETA DE IMPLEMENTACION
## Asistente Virtual Escolar

Esta guia te llevara desde cero hasta tener el proyecto funcionando en internet.
Tiempo estimado: 2-3 horas siguiendo cada paso.

---

## INDICE

1. [FASE 1: Preparacion del Entorno](#fase-1-preparacion-del-entorno)
2. [FASE 2: Configurar MongoDB Atlas](#fase-2-configurar-mongodb-atlas)
3. [FASE 3: Obtener API Key de OpenAI](#fase-3-obtener-api-key-de-openai)
4. [FASE 4: Crear el Backend](#fase-4-crear-el-backend)
5. [FASE 5: Probar el Backend Localmente](#fase-5-probar-el-backend-localmente)
6. [FASE 6: Crear el Frontend](#fase-6-crear-el-frontend)
7. [FASE 7: Desplegar Backend en Render](#fase-7-desplegar-backend-en-render)
8. [FASE 8: Desplegar Frontend en Vercel](#fase-8-desplegar-frontend-en-vercel)
9. [FASE 9: Troubleshooting](#fase-9-troubleshooting)

---

# FASE 1: PREPARACION DEL ENTORNO

## 1.1 Software a Instalar

### Node.js (version 18 o superior)
1. Ve a https://nodejs.org
2. Descarga la version LTS (Long Term Support)
3. Instala con las opciones por defecto
4. Verifica la instalacion abriendo terminal/cmd:
\`\`\`bash
node --version
# Debe mostrar v18.x.x o superior

npm --version
# Debe mostrar 9.x.x o superior
\`\`\`

### Git
1. Ve a https://git-scm.com/downloads
2. Descarga para tu sistema operativo
3. Instala con opciones por defecto
4. Verifica:
\`\`\`bash
git --version
# Debe mostrar git version 2.x.x
\`\`\`

### Visual Studio Code (Recomendado)
1. Ve a https://code.visualstudio.com
2. Descarga e instala
3. Extensiones recomendadas:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - MongoDB for VS Code

## 1.2 Cuentas Necesarias (TODAS GRATUITAS)

Crea cuentas en estos servicios:

| Servicio | URL | Para que sirve |
|----------|-----|----------------|
| GitHub | https://github.com | Guardar tu codigo |
| MongoDB Atlas | https://cloud.mongodb.com | Base de datos |
| OpenAI | https://platform.openai.com | Generar quizzes con IA |
| Render | https://render.com | Hospedar backend |
| Vercel | https://vercel.com | Hospedar frontend |

---

# FASE 2: CONFIGURAR MONGODB ATLAS

## 2.1 Crear Cuenta y Cluster

1. Ve a https://cloud.mongodb.com
2. Click "Try Free" o "Sign Up"
3. Registrate con Google o email
4. Responde las preguntas iniciales (puedes poner cualquier cosa)

## 2.2 Crear el Cluster (Base de Datos)

1. En la pagina inicial, click **"Build a Database"**
2. Selecciona **"M0 FREE"** (Shared - Gratis)
3. Provider: **AWS** (o cualquiera)
4. Region: Elige la mas cercana a ti:
   - Mexico/LATAM: `aws / Sao Paulo (sa-east-1)`
   - Espana: `aws / Frankfurt`
5. Cluster Name: `AsistenteEscolar`
6. Click **"Create"** (tarda 1-3 minutos)

## 2.3 Crear Usuario de Base de Datos

1. En el menu izquierdo: **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Ingresa:
   - Username: `adminEscolar`
   - Password: `MiPassword2024` (usa uno seguro y GUARDALO)
5. Database User Privileges: **"Read and write to any database"**
6. Click **"Add User"**

## 2.4 Configurar Acceso de Red

1. En el menu izquierdo: **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"ALLOW ACCESS FROM ANYWHERE"**
   - Esto agrega `0.0.0.0/0`
   - Necesario para que Render pueda conectarse
4. Click **"Confirm"**

## 2.5 Obtener Connection String (MUY IMPORTANTE)

1. En el menu izquierdo: **"Database"**
2. Click **"Connect"** en tu cluster
3. Selecciona **"Drivers"**
4. Driver: Node.js, Version: 6.0 or later
5. Copia el connection string. Se ve asi:
\`\`\`
mongodb+srv://adminEscolar:<password>@asistenteescolar.xxxxx.mongodb.net/?retryWrites=true&w=majority
\`\`\`
6. **IMPORTANTE**: Modifica el string:
   - Reemplaza `<password>` con tu password real
   - Agrega el nombre de la base de datos antes del `?`
   
   Resultado final:
\`\`\`
mongodb+srv://adminEscolar:MiPassword2024@asistenteescolar.xxxxx.mongodb.net/asistente-escolar?retryWrites=true&w=majority
\`\`\`

7. **GUARDA ESTE STRING** - Lo usaras como `MONGO_URI`

---

# FASE 3: OBTENER API KEY DE OPENAI

## 3.1 Crear Cuenta

1. Ve a https://platform.openai.com
2. Click "Sign Up"
3. Registrate con Google o email
4. Verifica tu email y telefono

## 3.2 Agregar Creditos (NECESARIO)

OpenAI ya no ofrece creditos gratis. Necesitas agregar fondos:

1. Ve a https://platform.openai.com/settings/organization/billing/overview
2. Click **"Add payment method"**
3. Agrega una tarjeta de credito/debito
4. Click **"Add to credit balance"**
5. Agrega **$5 USD** (suficiente para miles de quizzes)
   - Cada quiz cuesta aproximadamente $0.001 USD

## 3.3 Crear API Key

1. Ve a https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name: `asistente-escolar`
4. Click **"Create secret key"**
5. **COPIA LA KEY INMEDIATAMENTE**
   - Se muestra UNA SOLA VEZ
   - Formato: `sk-proj-xxxxxxxxxxxxxxxxxxxxx`
6. **GUARDA ESTA KEY** - La usaras como `OPENAI_API_KEY`

---

# FASE 4: CREAR EL BACKEND

## 4.1 Crear Estructura del Proyecto

Abre la terminal y ejecuta estos comandos:

\`\`\`bash
# 1. Crear carpeta principal del proyecto
mkdir asistente-escolar
cd asistente-escolar

# 2. Crear carpeta del backend
mkdir backend
cd backend

# 3. Inicializar proyecto Node.js
npm init -y
\`\`\`

## 4.2 Instalar Dependencias

\`\`\`bash
npm install express mongoose cors dotenv bcryptjs openai
\`\`\`

## 4.3 Configurar package.json

Abre `backend/package.json` y reemplaza TODO el contenido con:

\`\`\`json
{
  "name": "asistente-escolar-backend",
  "version": "1.0.0",
  "description": "Backend del Asistente Virtual Escolar",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "seed": "node scripts/seed-database.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "openai": "^4.20.0"
  }
}
\`\`\`

## 4.4 Crear Archivo de Variables de Entorno

Crea el archivo `backend/.env`:

\`\`\`env
PORT=3001
MONGO_URI=mongodb+srv://adminEscolar:MiPassword2024@asistenteescolar.xxxxx.mongodb.net/asistente-escolar?retryWrites=true&w=majority
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
\`\`\`

**IMPORTANTE**: Reemplaza los valores con TUS credenciales reales.

## 4.5 Crear Estructura de Carpetas

\`\`\`bash
# Dentro de backend/
mkdir models
mkdir scripts
\`\`\`

## 4.6 Crear Modelo de Usuario

Crea el archivo `backend/models/User.js`:

\`\`\`javascript
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username es requerido"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password es requerido"],
      minlength: 4,
    },
    role: {
      type: String,
      enum: ["admin", "docente", "estudiante"],
      default: "estudiante",
    },
    nivel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria"],
      required: function () {
        return this.role === "estudiante"
      },
    },
    grado: {
      type: Number,
      min: 1,
      max: 6,
      required: function () {
        return this.role === "estudiante"
      },
    },
    nombre: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Metodo para comparar passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Excluir password al convertir a JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model("User", userSchema)
\`\`\`

## 4.7 Crear Modelo de Curso

Crea el archivo `backend/models/Course.js`:

\`\`\`javascript
import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nombre del curso es requerido"],
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    descripcion: {
      type: String,
      trim: true,
    },
    nivel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria"],
    },
    grado: {
      type: Number,
      min: 1,
      max: 6,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model("Course", courseSchema)
\`\`\`

## 4.8 Crear Modelo de Notificacion

Crea el archivo `backend/models/Notification.js`:

\`\`\`javascript
import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Texto de notificacion es requerido"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["tarea", "quiz", "aviso", "recordatorio"],
      default: "aviso",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    targetLevel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria", "todos"],
      default: "todos",
    },
    targetGrade: {
      type: Number,
      min: 0,
      max: 6,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

notificationSchema.index({ targetLevel: 1, targetGrade: 1, isActive: 1 })

export default mongoose.model("Notification", notificationSchema)
\`\`\`

## 4.9 Crear Servidor Principal

Crea el archivo `backend/index.js`:

\`\`\`javascript
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

// Importar modelos
import User from "./models/User.js"
import Course from "./models/Course.js"
import Notification from "./models/Notification.js"

// Configuracion
dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// ============================================
// CONEXION A MONGODB
// ============================================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB Atlas conectado correctamente")
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message)
    process.exit(1)
  }
}

// ============================================
// CONFIGURACION OPENAI
// ============================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// RUTAS DE AUTENTICACION
// ============================================

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username y password son requeridos",
      })
    }

    const user = await User.findOne({ username: username.toLowerCase() })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales invalidas",
      })
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales invalidas",
      })
    }

    res.json({
      success: true,
      message: "Login exitoso",
      user: user.toJSON(),
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({
      success: false,
      message: "Error del servidor",
    })
  }
})

// POST /api/register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role, nivel, grado, nombre } = req.body

    const existingUser = await User.findOne({ username: username.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe",
      })
    }

    const user = new User({
      username,
      password,
      role: role || "estudiante",
      nivel,
      grado,
      nombre,
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: user.toJSON(),
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Error del servidor",
    })
  }
})

// ============================================
// RUTA DE IA - GENERAR QUIZ
// ============================================

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { topic } = req.body

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El tema (topic) es requerido",
      })
    }

    console.log(`Generando quiz sobre: "${topic}"`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un profesor experto. Genera un JSON con 5 preguntas de opcion multiple sobre el tema dado. 
          
FORMATO EXACTO (responde SOLO con el JSON array, sin texto adicional, sin markdown):
[
  {
    "pregunta": "Pregunta aqui?",
    "opciones": ["Opcion A", "Opcion B", "Opcion C", "Opcion D"],
    "respuestaCorrectaIndex": 0
  }
]

REGLAS:
- Exactamente 5 preguntas
- Exactamente 4 opciones por pregunta
- respuestaCorrectaIndex es el indice (0-3) de la respuesta correcta
- Preguntas claras y educativas
- NO incluyas explicaciones, solo el JSON array`,
        },
        {
          role: "user",
          content: `Genera un quiz sobre: ${topic}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    let responseText = completion.choices[0].message.content.trim()

    // Limpiar marcadores de codigo markdown
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let quiz
    try {
      quiz = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parseando JSON de OpenAI:", responseText)
      return res.status(500).json({
        success: false,
        message: "Error al procesar la respuesta de IA",
      })
    }

    if (!Array.isArray(quiz) || quiz.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Formato de quiz invalido",
      })
    }

    console.log(`Quiz generado con ${quiz.length} preguntas`)

    res.json({
      success: true,
      topic,
      quiz,
    })
  } catch (error) {
    console.error("Error generando quiz:", error)

    if (error.code === "insufficient_quota") {
      return res.status(503).json({
        success: false,
        message: "Cuota de API excedida",
      })
    }

    res.status(500).json({
      success: false,
      message: "Error al generar el quiz",
      error: error.message,
    })
  }
})

// ============================================
// RUTAS DE NOTIFICACIONES
// ============================================

// GET /api/notifications/:nivel/:grado
app.get("/api/notifications/:nivel/:grado", async (req, res) => {
  try {
    const { nivel, grado } = req.params

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        { targetLevel: nivel, targetGrade: Number.parseInt(grado) },
        { targetLevel: nivel, targetGrade: 0 },
        { targetLevel: "todos" },
      ],
    })
      .populate("courseId", "name color")
      .populate("createdBy", "nombre username")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener notificaciones",
    })
  }
})

// GET /api/notifications
app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("courseId", "name color")
      .populate("createdBy", "nombre username")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    })
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error)
    res.status(500).json({
      success: false,
      message: "Error al obtener notificaciones",
    })
  }
})

// POST /api/notifications
app.post("/api/notifications", async (req, res) => {
  try {
    const { text, type, courseId, dueDate, targetLevel, targetGrade, createdBy } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "El texto es requerido",
      })
    }

    const notification = new Notification({
      text,
      type: type || "aviso",
      courseId,
      dueDate,
      targetLevel: targetLevel || "todos",
      targetGrade: targetGrade || 0,
      createdBy,
    })

    await notification.save()

    await notification.populate("courseId", "name color")
    await notification.populate("createdBy", "nombre username")

    res.status(201).json({
      success: true,
      message: "Notificacion creada exitosamente",
      notification,
    })
  } catch (error) {
    console.error("Error creando notificacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear notificacion",
    })
  }
})

// DELETE /api/notifications/:id
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificacion no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Notificacion eliminada",
    })
  } catch (error) {
    console.error("Error eliminando notificacion:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar notificacion",
    })
  }
})

// ============================================
// RUTAS DE CURSOS
// ============================================

// GET /api/courses
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find().populate("teacherId", "nombre username")

    res.json({
      success: true,
      courses,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener cursos",
    })
  }
})

// POST /api/courses
app.post("/api/courses", async (req, res) => {
  try {
    const { name, teacherId, color, descripcion, nivel, grado } = req.body

    const course = new Course({
      name,
      teacherId,
      color,
      descripcion,
      nivel,
      grado,
    })

    await course.save()

    res.status(201).json({
      success: true,
      course,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear curso",
    })
  }
})

// ============================================
// RUTAS DE USUARIOS
// ============================================

// GET /api/users
app.get("/api/users", async (req, res) => {
  try {
    const { role } = req.query
    const filter = role ? { role } : {}

    const users = await User.find(filter).select("-password")

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
    })
  }
})

// ============================================
// RUTAS DE UTILIDAD
// ============================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Ruta raiz
app.get("/", (req, res) => {
  res.json({
    message: "API Asistente Virtual Escolar",
    version: "1.0.0",
    endpoints: {
      auth: ["POST /api/login", "POST /api/register"],
      quiz: ["POST /api/generate-quiz"],
      notifications: [
        "GET /api/notifications/:nivel/:grado",
        "GET /api/notifications",
        "POST /api/notifications",
        "DELETE /api/notifications/:id",
      ],
      courses: ["GET /api/courses", "POST /api/courses"],
      users: ["GET /api/users"],
    },
  })
})

// ============================================
// INICIAR SERVIDOR
// ============================================

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
    Servidor corriendo en puerto ${PORT}
    API Asistente Virtual Escolar
    ${new Date().toLocaleString()}
    
    Endpoints disponibles:
    - POST /api/login
    - POST /api/register
    - POST /api/generate-quiz
    - GET  /api/notifications/:nivel/:grado
    - POST /api/notifications
    `)
  })
})
\`\`\`

## 4.10 Crear Script de Seed (Datos Iniciales)

Crea el archivo `backend/scripts/seed-database.js`:

\`\`\`javascript
import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"

dotenv.config()

// Esquemas inline para el script
const userSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: String,
    nivel: String,
    grado: Number,
    nombre: String,
  },
  { timestamps: true }
)

const courseSchema = new mongoose.Schema(
  {
    name: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    color: String,
    nivel: String,
    grado: Number,
  },
  { timestamps: true }
)

const User = mongoose.model("User", userSchema)
const Course = mongoose.model("Course", courseSchema)

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Conectado a MongoDB")

    // Limpiar colecciones
    await User.deleteMany({})
    await Course.deleteMany({})
    console.log("Colecciones limpiadas")

    // Hash para passwords
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Crear usuarios
    const admin = await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      nombre: "Administrador",
    })

    const docente = await User.create({
      username: "profesor1",
      password: hashedPassword,
      role: "docente",
      nombre: "Maria Garcia",
    })

    await User.create({
      username: "estudiante1",
      password: hashedPassword,
      role: "estudiante",
      nivel: "secundaria",
      grado: 2,
      nombre: "Juan Perez",
    })

    await User.create({
      username: "estudiante2",
      password: hashedPassword,
      role: "estudiante",
      nivel: "primaria",
      grado: 5,
      nombre: "Ana Lopez",
    })

    console.log("Usuarios creados")

    // Crear cursos
    await Course.create([
      { name: "Matematicas", teacherId: docente._id, color: "#EF4444", nivel: "secundaria", grado: 2 },
      { name: "Historia", teacherId: docente._id, color: "#F59E0B", nivel: "secundaria", grado: 2 },
      { name: "Ciencias", teacherId: docente._id, color: "#10B981", nivel: "primaria", grado: 5 },
      { name: "Espanol", teacherId: docente._id, color: "#3B82F6", nivel: "primaria", grado: 5 },
    ])

    console.log("Cursos creados")

    console.log(`
    Base de datos sembrada exitosamente!
    
    Usuarios de prueba (password: 123456):
    - admin       -> Administrador
    - profesor1   -> Docente
    - estudiante1 -> Estudiante (secundaria, grado 2)
    - estudiante2 -> Estudiante (primaria, grado 5)
    `)

    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

seed()
\`\`\`

## 4.11 Estructura Final del Backend

Tu carpeta `backend` debe verse asi:

\`\`\`
backend/
├── models/
│   ├── User.js
│   ├── Course.js
│   └── Notification.js
├── scripts/
│   └── seed-database.js
├── .env
├── index.js
└── package.json
\`\`\`

---

# FASE 5: PROBAR EL BACKEND LOCALMENTE

## 5.1 Instalar Dependencias

\`\`\`bash
cd backend
npm install
\`\`\`

## 5.2 Sembrar la Base de Datos

\`\`\`bash
npm run seed
\`\`\`

Deberias ver:
\`\`\`
Conectado a MongoDB
Colecciones limpiadas
Usuarios creados
Cursos creados
Base de datos sembrada exitosamente!
\`\`\`

## 5.3 Iniciar el Servidor

\`\`\`bash
npm start
\`\`\`

Deberias ver:
\`\`\`
Servidor corriendo en puerto 3001
API Asistente Virtual Escolar
\`\`\`

## 5.4 Probar los Endpoints

### Probar con el navegador:
- Abre http://localhost:3001 - Debe mostrar info de la API
- Abre http://localhost:3001/api/health - Debe mostrar status OK

### Probar Login (con curl o Postman):

\`\`\`bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"estudiante1","password":"123456"}'
\`\`\`

Respuesta esperada:
\`\`\`json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "_id": "...",
    "username": "estudiante1",
    "role": "estudiante",
    "nivel": "secundaria",
    "grado": 2,
    "nombre": "Juan Perez"
  }
}
\`\`\`

### Probar Generador de Quiz:

\`\`\`bash
curl -X POST http://localhost:3001/api/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"La Revolucion Francesa"}'
\`\`\`

Respuesta esperada (tarda 5-10 segundos):
\`\`\`json
{
  "success": true,
  "topic": "La Revolucion Francesa",
  "quiz": [
    {
      "pregunta": "En que ano comenzo la Revolucion Francesa?",
      "opciones": ["1789", "1776", "1799", "1804"],
      "respuestaCorrectaIndex": 0
    },
    ...
  ]
}
\`\`\`

---

# FASE 6: CREAR EL FRONTEND

El frontend ya esta creado en v0. Solo necesitas asegurarte de que la conexion al backend este correcta.

## 6.1 Verificar archivo lib/api.ts

Este archivo ya existe y contiene:

\`\`\`typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
\`\`\`

Esto significa:
- En desarrollo: usa `http://localhost:3001/api`
- En produccion: usa la variable de entorno `NEXT_PUBLIC_API_URL`

---

# FASE 7: DESPLEGAR BACKEND EN RENDER

## 7.1 Subir Backend a GitHub

Primero, crea un repositorio en GitHub:

1. Ve a https://github.com/new
2. Repository name: `asistente-escolar-backend`
3. Visibilidad: Public o Private
4. Click "Create repository"

Luego, sube tu codigo:

\`\`\`bash
cd backend

# Crear .gitignore
echo "node_modules
.env
.DS_Store" > .gitignore

# Inicializar git
git init
git add .
git commit -m "Backend asistente escolar"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/asistente-escolar-backend.git
git push -u origin main
\`\`\`

## 7.2 Crear Servicio en Render

1. Ve a https://render.com
2. Click "Sign In" - usa tu cuenta de GitHub
3. Click **"New +"** -> **"Web Service"**
4. Conecta tu repositorio de GitHub
   - Si no aparece, click "Configure account" y da permisos
5. Selecciona `asistente-escolar-backend`

## 7.3 Configurar el Servicio

Completa estos campos:

| Campo | Valor |
|-------|-------|
| Name | `asistente-escolar-api` |
| Region | El mas cercano a ti |
| Branch | `main` |
| Root Directory | (dejar vacio) |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Instance Type | `Free` |

## 7.4 Agregar Variables de Entorno

En la seccion **"Environment Variables"**, agrega:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://adminEscolar:...` (tu connection string completo) |
| `OPENAI_API_KEY` | `sk-proj-...` (tu API key de OpenAI) |
| `NODE_ENV` | `production` |

## 7.5 Crear el Servicio

Click **"Create Web Service"**

El despliegue tarda 2-5 minutos. Cuando termine, veras:
- URL: `https://asistente-escolar-api.onrender.com`
- Status: "Live"

## 7.6 Probar el Backend en Produccion

Abre en el navegador:
- `https://asistente-escolar-api.onrender.com` - Info de la API
- `https://asistente-escolar-api.onrender.com/api/health` - Status

**IMPORTANTE**: El servicio gratis de Render se "duerme" tras 15 minutos sin uso. La primera peticion tarda ~30 segundos en "despertar".

---

# FASE 8: DESPLEGAR FRONTEND EN VERCEL

## 8.1 Opcion A: Desde v0 (Mas Facil)

1. En v0, click el boton **"Publish"** en la esquina superior derecha
2. Sigue las instrucciones para conectar con Vercel
3. Cuando te pida variables de entorno, agrega:
   - `NEXT_PUBLIC_API_URL` = `https://asistente-escolar-api.onrender.com/api`
4. Click "Deploy"

## 8.2 Opcion B: Desde GitHub

Si prefieres tener el codigo en GitHub:

1. Descarga el proyecto de v0 (click tres puntos -> "Download ZIP")
2. Descomprime y sube a GitHub
3. Ve a https://vercel.com
4. Click "Add New Project"
5. Importa el repositorio
6. En "Environment Variables" agrega:
   - `NEXT_PUBLIC_API_URL` = `https://asistente-escolar-api.onrender.com/api`
7. Click "Deploy"

## 8.3 Verificar Despliegue

Cuando termine el despliegue:
1. Abre la URL de Vercel (ej: `https://tu-proyecto.vercel.app`)
2. Intenta hacer login con `estudiante1` / `123456`
3. Verifica que carguen las notificaciones
4. Prueba el generador de quiz

---

# FASE 9: TROUBLESHOOTING

## Error 1: CORS - "blocked by CORS policy"

**Sintoma**: El frontend no puede conectar con el backend.

**Solucion**: Verifica que el backend tenga CORS configurado:

\`\`\`javascript
// En index.js
app.use(cors())  // Permite todos los origenes
\`\`\`

O para ser mas especifico:

\`\`\`javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-proyecto.vercel.app'
  ]
}))
\`\`\`

## Error 2: "MongooseServerSelectionError"

**Sintoma**: No conecta a MongoDB.

**Checklist**:
- [ ] El connection string es correcto
- [ ] Reemplazaste `<password>` con tu password real
- [ ] Agregaste el nombre de la base de datos
- [ ] Network Access en MongoDB Atlas tiene `0.0.0.0/0`
- [ ] El usuario tiene permisos de lectura/escritura

## Error 3: "Invalid API Key" de OpenAI

**Sintoma**: El quiz no se genera.

**Checklist**:
- [ ] La API key es correcta (empieza con `sk-`)
- [ ] Tienes creditos en tu cuenta de OpenAI
- [ ] La variable `OPENAI_API_KEY` esta configurada en Render

## Error 4: El backend en Render esta "dormido"

**Sintoma**: La primera peticion tarda 30+ segundos.

**Soluciones**:
1. **Aceptar el delay**: Avisa a tu profesor que la primera carga tarda
2. **Usar UptimeRobot**: Crea cuenta en uptimerobot.com y agrega un monitor HTTP que haga ping a tu backend cada 14 minutos
3. **Usar Railway.app**: Alternativa a Render que no duerme los servicios

## Error 5: "Cannot read property of undefined"

**Sintoma**: Error en el frontend al mostrar datos.

**Solucion**: Verifica que las respuestas del backend tengan la estructura esperada. Agrega console.log para debuggear:

\`\`\`javascript
const response = await fetch(...)
const data = await response.json()
console.log('Respuesta:', data)  // Ver que devuelve
\`\`\`

---

# RESUMEN FINAL

## URLs de tu Proyecto

| Servicio | URL |
|----------|-----|
| Backend (Render) | `https://asistente-escolar-api.onrender.com` |
| Frontend (Vercel) | `https://tu-proyecto.vercel.app` |
| MongoDB Atlas | `cloud.mongodb.com` |
| OpenAI | `platform.openai.com` |

## Usuarios de Prueba

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | 123456 | Administrador |
| profesor1 | 123456 | Docente |
| estudiante1 | 123456 | Estudiante (secundaria, grado 2) |
| estudiante2 | 123456 | Estudiante (primaria, grado 5) |

## Checklist Final

- [ ] MongoDB Atlas configurado con usuario y acceso de red
- [ ] OpenAI con creditos y API key
- [ ] Backend funcionando localmente
- [ ] Datos de prueba sembrados
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas en Render
- [ ] Frontend desplegado en Vercel
- [ ] Variable NEXT_PUBLIC_API_URL configurada en Vercel
- [ ] Login funciona en produccion
- [ ] Quiz se genera correctamente
- [ ] Notificaciones se muestran

---

Documento creado para el proyecto Asistente Virtual Escolar.
Tiempo estimado de implementacion: 2-3 horas.
