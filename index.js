import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai"

// Importar modelos
import User from "./models/User.js"
import Course from "./models/Course.js"
import Notification from "./models/Notification.js"

// Configuración
dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// ============================================
// CONEXIÓN A MONGODB
// ============================================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("✅ MongoDB Atlas conectado correctamente")
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message)
    process.exit(1)
  }
}

// ============================================
// CONFIGURACIÓN OPENAI
// ============================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// POST /api/login - Login de usuario
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username y password son requeridos",
      })
    }

    // Buscar usuario
    const user = await User.findOne({ username: username.toLowerCase() })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Verificar password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Devolver usuario (sin password gracias al toJSON)
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

// POST /api/register - Registro de usuario (útil para setup inicial)
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role, nivel, grado, nombre } = req.body

    // Verificar si usuario existe
    const existingUser = await User.findOne({ username: username.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe",
      })
    }

    // Crear usuario
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
// RUTA DE IA - GENERAR QUIZ (CRÍTICA)
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

    console.log(`🤖 Generando quiz sobre: "${topic}"`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Más económico y rápido
      messages: [
        {
          role: "system",
          content: `Eres un profesor experto. Genera un JSON con 5 preguntas de opción múltiple sobre el tema dado. 
          
FORMATO EXACTO (responde SOLO con el JSON array, sin texto adicional, sin markdown):
[
  {
    "pregunta": "¿Pregunta aquí?",
    "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "respuestaCorrectaIndex": 0
  }
]

REGLAS:
- Exactamente 5 preguntas
- Exactamente 4 opciones por pregunta
- respuestaCorrectaIndex es el índice (0-3) de la respuesta correcta
- Preguntas claras y educativas
- Dificultad apropiada para estudiantes
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

    // Extraer respuesta
    let responseText = completion.choices[0].message.content.trim()

    // Limpiar posibles marcadores de código markdown
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    // Parsear JSON
    let quiz
    try {
      quiz = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parseando JSON de OpenAI:", responseText)
      return res.status(500).json({
        success: false,
        message: "Error al procesar la respuesta de IA",
        raw: responseText, // Para debug
      })
    }

    // Validar estructura
    if (!Array.isArray(quiz) || quiz.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Formato de quiz inválido",
      })
    }

    console.log(`✅ Quiz generado con ${quiz.length} preguntas`)

    res.json({
      success: true,
      topic,
      quiz,
    })
  } catch (error) {
    console.error("Error generando quiz:", error)

    // Manejo específico de errores de OpenAI
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

// GET /api/notifications/:nivel/:grado - Obtener notificaciones para estudiante
app.get("/api/notifications/:nivel/:grado", async (req, res) => {
  try {
    const { nivel, grado } = req.params

    const notifications = await Notification.find({
      isActive: true,
      $or: [
        // Notificaciones específicas para el nivel y grado
        { targetLevel: nivel, targetGrade: Number.parseInt(grado) },
        // Notificaciones para todos los grados del nivel
        { targetLevel: nivel, targetGrade: 0 },
        // Notificaciones globales
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

// GET /api/notifications - Obtener todas las notificaciones (admin/docente)
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

// POST /api/notifications - Crear notificación (docente)
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

    // Poblar referencias para la respuesta
    await notification.populate("courseId", "name color")
    await notification.populate("createdBy", "nombre username")

    res.status(201).json({
      success: true,
      message: "Notificación creada exitosamente",
      notification,
    })
  } catch (error) {
    console.error("Error creando notificación:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear notificación",
    })
  }
})

// DELETE /api/notifications/:id - Eliminar notificación
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Notificación eliminada",
    })
  } catch (error) {
    console.error("Error eliminando notificación:", error)
    res.status(500).json({
      success: false,
      message: "Error al eliminar notificación",
    })
  }
})

// ============================================
// RUTAS DE CURSOS (BONUS)
// ============================================

// GET /api/courses - Obtener todos los cursos
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

// POST /api/courses - Crear curso
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
// RUTAS DE USUARIOS (BONUS - Admin)
// ============================================

// GET /api/users - Obtener todos los usuarios
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
// RUTA DE HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "🎓 API Asistente Virtual Escolar",
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
    🚀 Servidor corriendo en puerto ${PORT}
    📚 API Asistente Virtual Escolar
    ⏰ ${new Date().toLocaleString()}
    
    Endpoints disponibles:
    • POST /api/login
    • POST /api/register
    • POST /api/generate-quiz
    • GET  /api/notifications/:nivel/:grado
    • POST /api/notifications
    `)
  })
})
