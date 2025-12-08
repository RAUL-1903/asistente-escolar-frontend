# Guia Paso a Paso - Implementacion de Mejoras

Esta guia te llevara paso a paso para implementar todas las mejoras:
- Estudiante puede marcar tareas como completadas
- Estudiante puede responder quizzes
- IA genera consejos de estudio
- Interfaz mejorada con colores vivos

---

## PARTE 1: MODIFICACIONES EN EL BACKEND

### Paso 1.1: Actualizar modelo Notification

**Archivo:** `backend/models/Notification.js`

**Accion:** Borra TODO el contenido y pega este codigo:

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
    // NUEVOS CAMPOS PARA QUIZZES
    quizData: [{
      pregunta: String,
      opciones: [String],
      respuestaCorrectaIndex: Number
    }],
    // CAMPO PARA RASTREAR COMPLETADOS POR ESTUDIANTE
    completedBy: [{
      odId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      odUsername: String,
      completedAt: {
        type: Date,
        default: Date.now
      },
      score: Number // Para quizzes: puntuacion obtenida
    }]
  },
  {
    timestamps: true,
  }
)

notificationSchema.index({ targetLevel: 1, targetGrade: 1, isActive: 1 })

export default mongoose.model("Notification", notificationSchema)
\`\`\`

---

### Paso 1.2: Agregar nuevas rutas al index.js

**Archivo:** `backend/index.js`

**Accion:** Busca la seccion de rutas de notificaciones y agrega estas NUEVAS rutas. 

Busca esta linea:
\`\`\`javascript
// DELETE /api/notifications/:id - Eliminar notificación
\`\`\`

Y ANTES de esa linea, agrega este codigo:

\`\`\`javascript
// ============================================
// RUTA DE IA - GENERAR CONSEJOS
// ============================================

app.post("/api/generate-advice", async (req, res) => {
  try {
    const { topic } = req.body

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El tema (topic) es requerido",
      })
    }

    console.log(`Generando consejos sobre: "${topic}"`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un tutor experto y amigable. Genera consejos de estudio sobre el tema dado.

FORMATO JSON (responde SOLO con el JSON, sin texto adicional):
{
  "summary": "Resumen breve del tema en 2-3 oraciones",
  "tips": ["Consejo 1", "Consejo 2", "Consejo 3", "Consejo 4", "Consejo 5"],
  "resources": ["Recurso sugerido 1", "Recurso sugerido 2", "Recurso sugerido 3"]
}

REGLAS:
- El resumen debe ser claro y facil de entender
- Incluye 5 consejos practicos de estudio especificos para el tema
- Sugiere 3 recursos (libros, tipos de videos, actividades practicas)
- NO incluyas URLs, solo nombres descriptivos de recursos
- Usa un tono motivador y amigable`,
        },
        {
          role: "user",
          content: `Dame consejos de estudio sobre: ${topic}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    let responseText = completion.choices[0].message.content.trim()
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let advice
    try {
      advice = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Error parseando JSON de consejos:", responseText)
      advice = {
        summary: "Este es un tema muy interesante para estudiar y dominar.",
        tips: [
          "Estudia en sesiones cortas de 25 minutos",
          "Toma notas con tus propias palabras",
          "Practica con ejercicios variados",
          "Ensena lo que aprendiste a alguien mas",
          "Repasa antes de dormir"
        ],
        resources: [
          "Videos educativos en YouTube",
          "Libros de texto del tema",
          "Ejercicios practicos online"
        ],
      }
    }

    console.log("Consejos generados exitosamente")

    res.json({
      success: true,
      topic,
      advice,
    })
  } catch (error) {
    console.error("Error generando consejos:", error)
    res.status(500).json({
      success: false,
      message: "Error al generar consejos",
    })
  }
})

// ============================================
// RUTA PARA MARCAR TAREA COMO COMPLETADA
// ============================================

app.post("/api/notifications/:id/complete", async (req, res) => {
  try {
    const { id } = req.params
    const { odId, odUsername, score } = req.body

    const notification = await Notification.findById(id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificacion no encontrada",
      })
    }

    // Verificar si el usuario ya completo esta tarea
    const alreadyCompleted = notification.completedBy.some(
      (c) => c.odUsername === odUsername
    )

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Ya completaste esta tarea",
      })
    }

    // Agregar al array de completados
    notification.completedBy.push({
      odId,
      odUsername,
      completedAt: new Date(),
      score: score || null,
    })

    await notification.save()

    res.json({
      success: true,
      message: "Tarea marcada como completada",
      notification,
    })
  } catch (error) {
    console.error("Error completando tarea:", error)
    res.status(500).json({
      success: false,
      message: "Error al completar tarea",
    })
  }
})

// ============================================
// RUTA PARA CREAR NOTIFICACION CON QUIZ
// ============================================

app.post("/api/notifications/with-quiz", async (req, res) => {
  try {
    const { text, targetLevel, targetGrade, courseId, createdBy, quizData } = req.body

    if (!text || !quizData || quizData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Texto y datos del quiz son requeridos",
      })
    }

    const notification = new Notification({
      text,
      type: "quiz",
      courseId,
      targetLevel: targetLevel || "todos",
      targetGrade: targetGrade || 0,
      createdBy,
      quizData,
    })

    await notification.save()
    await notification.populate("courseId", "name color")
    await notification.populate("createdBy", "nombre username")

    res.status(201).json({
      success: true,
      message: "Quiz creado exitosamente",
      notification,
    })
  } catch (error) {
    console.error("Error creando quiz:", error)
    res.status(500).json({
      success: false,
      message: "Error al crear quiz",
    })
  }
})
\`\`\`

---

### Paso 1.3: Subir cambios del backend a GitHub

En la terminal, navega a la carpeta backend:

\`\`\`bash
cd C:\Users\Raul\Documents\asistente-escolar\backend
\`\`\`

Ejecuta estos comandos:

\`\`\`bash
git add .
git commit -m "Agregar rutas de consejos IA y completar tareas"
git push
\`\`\`

---

### Paso 1.4: Redesplegar en Render

1. Ve a [render.com](https://render.com)
2. Entra a tu servicio `asistente-escolar-api`
3. Render detectara los cambios automaticamente y redesplegara
4. Si no, click en **"Manual Deploy"** > **"Deploy latest commit"**
5. Espera 2-3 minutos

---

## PARTE 2: MODIFICACIONES EN EL FRONTEND

Ahora navega a la carpeta del frontend:

\`\`\`bash
cd C:\Users\Raul\Documents\asistente-escolar\frontend
\`\`\`

### Paso 2.1: Actualizar lib/api.ts

**Archivo:** `frontend/lib/api.ts`

**Accion:** Borra TODO el contenido y pega este codigo:

\`\`\`typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export interface User {
  _id: string
  username: string
  role: "admin" | "docente" | "estudiante"
  nivel?: string
  grado?: number
  nombre?: string
}

export interface CompletedBy {
  odId: string
  odUsername: string
  completedAt: string
  score?: number
}

export interface Notification {
  _id: string
  text: string
  type: "tarea" | "quiz" | "aviso" | "recordatorio"
  courseId?: {
    _id: string
    name: string
    color: string
  }
  createdBy?: {
    _id: string
    nombre: string
    username: string
  }
  date: string
  dueDate?: string
  targetLevel: string
  targetGrade: number
  quizData?: QuizQuestion[]
  completedBy?: CompletedBy[]
}

export interface QuizQuestion {
  pregunta: string
  opciones: string[]
  respuestaCorrectaIndex: number
}

export interface AIAdvice {
  tips: string[]
  resources: string[]
  summary: string
}

export interface Course {
  _id: string
  name: string
  color: string
  nivel: string
  grado: number
  teacherId: {
    _id: string
    nombre: string
    username: string
  }
}

// AUTH
export async function login(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al iniciar sesion")
  }
  return data.user
}

export async function createUser(userData: {
  username: string
  password: string
  role: "admin" | "docente" | "estudiante"
  nombre: string
  nivel?: string
  grado?: number
}): Promise<User> {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al crear usuario")
  }
  return data.user
}

export async function getUsers(role?: string): Promise<User[]> {
  const url = role ? `${API_URL}/users?role=${role}` : `${API_URL}/users`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error("Error al obtener usuarios")
  }
  return data.users
}

// NOTIFICATIONS
export async function getNotifications(nivel: string, grado: number): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/notifications/${nivel}/${grado}`)
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error("Error al obtener notificaciones")
  }
  return data.notifications
}

export async function getAllNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/notifications`)
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error("Error al obtener notificaciones")
  }
  return data.notifications
}

export async function createNotification(notificationData: {
  text: string
  type: "tarea" | "quiz" | "aviso" | "recordatorio"
  targetLevel: string
  targetGrade: number
  courseId?: string
  createdBy?: string
  dueDate?: string
}): Promise<Notification> {
  const res = await fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationData),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al crear notificacion")
  }
  return data.notification
}

export async function createNotificationWithQuiz(notificationData: {
  text: string
  targetLevel: string
  targetGrade: number
  courseId?: string
  createdBy?: string
  quizData: QuizQuestion[]
}): Promise<Notification> {
  const res = await fetch(`${API_URL}/notifications/with-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationData),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al crear quiz")
  }
  return data.notification
}

export async function completeNotification(
  notificationId: string,
  userId: string,
  username: string,
  score?: number
): Promise<Notification> {
  const res = await fetch(`${API_URL}/notifications/${notificationId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ odId: odId, odUsername: username, score }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al completar tarea")
  }
  return data.notification
}

// COURSES
export async function getCourses(): Promise<Course[]> {
  const res = await fetch(`${API_URL}/courses`)
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error("Error al obtener cursos")
  }
  return data.courses
}

export async function createCourse(courseData: {
  name: string
  teacherId: string
  color: string
  nivel: string
  grado: number
}): Promise<Course> {
  const res = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(courseData),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al crear curso")
  }
  return data.course
}

// AI
export async function generateQuiz(topic: string): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al generar quiz")
  }
  return data.quiz
}

export async function generateAdvice(topic: string): Promise<AIAdvice> {
  const res = await fetch(`${API_URL}/generate-advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al generar consejos")
  }
  return data.advice
}
\`\`\`

---

### Paso 2.2: Crear componente QuizModal

**Archivo:** `frontend/components/quiz-modal.tsx` (CREAR NUEVO)

**Accion:** Crea este archivo nuevo con el siguiente contenido:

\`\`\`tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Trophy, X } from 'lucide-react'
import type { QuizQuestion } from "@/lib/api"

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  quizData: QuizQuestion[]
  quizTitle: string
  onComplete: (score: number) => void
}

export function QuizModal({ isOpen, onClose, quizData, quizTitle, onComplete }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  if (!isOpen) return null

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calcular puntuacion
      let correctCount = 0
      quizData.forEach((q, index) => {
        if (selectedAnswers[index] === q.respuestaCorrectaIndex) {
          correctCount++
        }
      })
      const finalScore = Math.round((correctCount / quizData.length) * 100)
      setScore(finalScore)
      setShowResults(true)
      onComplete(finalScore)
    }
  }

  const handleClose = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setScore(0)
    onClose()
  }

  const question = quizData[currentQuestion]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{quizTitle}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {!showResults && (
            <p className="text-sm text-white/80">
              Pregunta {currentQuestion + 1} de {quizData.length}
            </p>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {showResults ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <Trophy className={`h-20 w-20 mx-auto ${score >= 70 ? "text-yellow-500" : "text-gray-400"}`} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Quiz Completado</h3>
              <p className="text-4xl font-bold mb-4" style={{ color: score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444" }}>
                {score}%
              </p>
              <p className="text-muted-foreground mb-6">
                Respondiste correctamente {selectedAnswers.filter((a, i) => a === quizData[i].respuestaCorrectaIndex).length} de {quizData.length} preguntas
              </p>
              
              {/* Resumen de respuestas */}
              <div className="text-left space-y-3 mt-6 border-t pt-6">
                <h4 className="font-semibold mb-4">Resumen:</h4>
                {quizData.map((q, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {selectedAnswers[index] === q.respuestaCorrectaIndex ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{q.pregunta}</p>
                      <p className="text-xs text-green-600">Correcta: {q.opciones[q.respuestaCorrectaIndex]}</p>
                      {selectedAnswers[index] !== q.respuestaCorrectaIndex && (
                        <p className="text-xs text-red-600">Tu respuesta: {q.opciones[selectedAnswers[index]]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleClose} className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500">
                Cerrar
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-6">{question.pregunta}</h3>
              
              <RadioGroup
                value={selectedAnswers[currentQuestion]?.toString()}
                onValueChange={(value) => handleSelectAnswer(parseInt(value))}
                className="space-y-3"
              >
                {question.opciones.map((opcion, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedAnswers[currentQuestion] === index
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200"
                    }`}
                    onClick={() => handleSelectAnswer(index)}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {opcion}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  Anterior
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {currentQuestion === quizData.length - 1 ? "Finalizar" : "Siguiente"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
\`\`\`

---

### Paso 2.3: Crear componente AdviceCard

**Archivo:** `frontend/components/advice-card.tsx` (CREAR NUEVO)

**Accion:** Crea este archivo nuevo:

\`\`\`tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, BookOpen, Sparkles } from 'lucide-react'
import type { AIAdvice } from "@/lib/api"

interface AdviceCardProps {
  advice: AIAdvice
  topic: string
}

export function AdviceCard({ advice, topic }: AdviceCardProps) {
  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Sparkles className="h-5 w-5" />
          Consejos de estudio: {topic}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-700">{advice.summary}</p>
        </div>

        {/* Tips */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2 text-purple-700">
            <Lightbulb className="h-4 w-4" />
            Tips de estudio
          </h4>
          <ul className="space-y-2">
            {advice.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                  {index + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recursos */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2 text-pink-700">
            <BookOpen className="h-4 w-4" />
            Recursos recomendados
          </h4>
          <ul className="space-y-1">
            {advice.resources.map((resource, index) => (
              <li key={index} className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                {resource}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
\`\`\`

---

### Paso 2.4: Actualizar pagina del estudiante

**Archivo:** `frontend/app/dashboard/student/page.tsx`

**Accion:** Borra TODO el contenido y pega este codigo:

\`\`\`tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle2, Clock, FileText, Volume2, VolumeX, Sparkles, Loader2, Brain } from 'lucide-react'
import { getNotifications, completeNotification, generateAdvice } from "@/lib/api"
import type { Notification, User, AIAdvice } from "@/lib/api"
import { QuizModal } from "@/components/quiz-modal"
import { AdviceCard } from "@/components/advice-card"

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Quiz state
  const [selectedQuiz, setSelectedQuiz] = useState<Notification | null>(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  
  // Advice state
  const [advice, setAdvice] = useState<AIAdvice | null>(null)
  const [adviceTopic, setAdviceTopic] = useState("")
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "estudiante") {
      router.push("/login")
      return
    }

    setUser(userData)
    loadNotifications(userData.nivel, userData.grado)
  }, [router])

  const loadNotifications = async (nivel: string, grado: number) => {
    try {
      const data = await getNotifications(nivel, grado)
      setNotifications(data)
    } catch (error) {
      console.error("Error cargando notificaciones:", error)
    } finally {
      setLoading(false)
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-MX"
      utterance.rate = 0.9
      utterance.onend = () => setIsSpeaking(false)
      
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleCompleteTask = async (notification: Notification) => {
    if (!user) return

    try {
      await completeNotification(notification._id, user._id, user.username)
      // Recargar notificaciones
      loadNotifications(user.nivel!, user.grado!)
    } catch (error) {
      console.error("Error completando tarea:", error)
      alert("Error al marcar como completada")
    }
  }

  const handleOpenQuiz = (notification: Notification) => {
    setSelectedQuiz(notification)
    setShowQuizModal(true)
  }

  const handleQuizComplete = async (score: number) => {
    if (!user || !selectedQuiz) return

    try {
      await completeNotification(selectedQuiz._id, user._id, user.username, score)
      loadNotifications(user.nivel!, user.grado!)
    } catch (error) {
      console.error("Error guardando resultado:", error)
    }
  }

  const handleGetAdvice = async (topic: string) => {
    setLoadingAdvice(true)
    setAdviceTopic(topic)
    try {
      const data = await generateAdvice(topic)
      setAdvice(data)
    } catch (error) {
      console.error("Error obteniendo consejos:", error)
      alert("Error al obtener consejos")
    } finally {
      setLoadingAdvice(false)
    }
  }

  const isCompletedByUser = (notification: Notification) => {
    if (!user || !notification.completedBy) return false
    return notification.completedBy.some((c) => c.odUsername === user.username)
  }

  const getUserScore = (notification: Notification) => {
    if (!user || !notification.completedBy) return null
    const completed = notification.completedBy.find((c) => c.odUsername === user.username)
    return completed?.score
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tarea":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "quiz":
        return "bg-gradient-to-r from-purple-500 to-pink-500"
      case "aviso":
        return "bg-gradient-to-r from-amber-500 to-orange-500"
      case "recordatorio":
        return "bg-gradient-to-r from-green-500 to-emerald-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tarea":
        return <FileText className="h-5 w-5" />
      case "quiz":
        return <Brain className="h-5 w-5" />
      case "aviso":
        return <BookOpen className="h-5 w-5" />
      case "recordatorio":
        return <Clock className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  if (!user) return null

  const pendingTasks = notifications.filter((n) => !isCompletedByUser(n))
  const completedTasks = notifications.filter((n) => isCompletedByUser(n))

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Hola, {user.nombre || user.username}!
          </h1>
          <p className="text-white/80">
            {user.nivel} - {user.grado}° grado | 
            Tienes {pendingTasks.length} actividades pendientes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{pendingTasks.length}</p>
                  <p className="text-sm text-blue-600">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{completedTasks.length}</p>
                  <p className="text-sm text-green-600">Completadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl text-white">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {notifications.filter((n) => n.type === "quiz").length}
                  </p>
                  <p className="text-sm text-purple-600">Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consejos de IA */}
        {advice && (
          <AdviceCard advice={advice} topic={adviceTopic} />
        )}

        {/* Tareas pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Actividades Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No tienes actividades pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((notification) => (
                  <div
                    key={notification._id}
                    className="p-4 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg text-white ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {notification.type}
                            </Badge>
                            {notification.courseId && (
                              <Badge 
                                style={{ backgroundColor: notification.courseId.color }}
                                className="text-white text-xs"
                              >
                                {notification.courseId.name}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{notification.text}</p>
                          {notification.dueDate && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Fecha limite: {new Date(notification.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Boton de voz */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => speakText(notification.text)}
                          className="text-purple-500 hover:bg-purple-100"
                        >
                          {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>

                        {/* Boton de consejos IA */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGetAdvice(notification.text)}
                          disabled={loadingAdvice}
                          className="text-pink-500 hover:bg-pink-100"
                        >
                          {loadingAdvice ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                        </Button>

                        {/* Boton de accion */}
                        {notification.type === "quiz" && notification.quizData ? (
                          <Button
                            onClick={() => handleOpenQuiz(notification)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Responder Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleCompleteTask(notification)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Actividades Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedTasks.map((notification) => (
                  <div
                    key={notification._id}
                    className="p-4 rounded-xl border border-green-200 bg-green-50/50 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium line-through text-muted-foreground">
                            {notification.text}
                          </p>
                          {notification.type === "quiz" && getUserScore(notification) !== null && (
                            <p className="text-sm text-green-600">
                              Puntuacion: {getUserScore(notification)}%
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Completado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && selectedQuiz.quizData && (
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => {
            setShowQuizModal(false)
            setSelectedQuiz(null)
          }}
          quizData={selectedQuiz.quizData}
          quizTitle={selectedQuiz.text}
          onComplete={handleQuizComplete}
        />
      )}
    </DashboardLayout>
  )
}
\`\`\`

---

### Paso 2.5: Actualizar pagina del profesor

**Archivo:** `frontend/app/dashboard/teacher/page.tsx`

**Accion:** Borra TODO el contenido y pega este codigo:

\`\`\`tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Brain, FileText, Users, Loader2, Send, Sparkles, BookOpen } from 'lucide-react'
import { 
  createNotification, 
  generateQuiz, 
  createNotificationWithQuiz,
  getAllNotifications,
  getCourses
} from "@/lib/api"
import type { User, Notification, QuizQuestion, Course } from "@/lib/api"

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [taskText, setTaskText] = useState("")
  const [taskType, setTaskType] = useState<"tarea" | "aviso" | "recordatorio">("tarea")
  const [targetLevel, setTargetLevel] = useState("secundaria")
  const [targetGrade, setTargetGrade] = useState("1")
  const [selectedCourse, setSelectedCourse] = useState("")

  // Quiz states
  const [quizTopic, setQuizTopic] = useState("")
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [savingQuiz, setSavingQuiz] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "docente") {
      router.push("/login")
      return
    }

    setUser(userData)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [notifs, coursesData] = await Promise.all([
        getAllNotifications(),
        getCourses()
      ])
      setNotifications(notifs)
      setCourses(coursesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!taskText.trim() || !user) return

    try {
      await createNotification({
        text: taskText,
        type: taskType,
        targetLevel,
        targetGrade: parseInt(targetGrade),
        courseId: selectedCourse || undefined,
        createdBy: user._id,
      })

      setTaskText("")
      setIsTaskModalOpen(false)
      loadData()
      alert("Tarea creada exitosamente")
    } catch (error) {
      console.error("Error creando tarea:", error)
      alert("Error al crear tarea")
    }
  }

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return

    setGeneratingQuiz(true)
    try {
      const quiz = await generateQuiz(quizTopic)
      setGeneratedQuiz(quiz)
    } catch (error) {
      console.error("Error generando quiz:", error)
      alert("Error al generar quiz")
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !user) return

    setSavingQuiz(true)
    try {
      await createNotificationWithQuiz({
        text: `Quiz: ${quizTopic}`,
        targetLevel,
        targetGrade: parseInt(targetGrade),
        courseId: selectedCourse || undefined,
        createdBy: user._id,
        quizData: generatedQuiz,
      })

      setQuizTopic("")
      setGeneratedQuiz(null)
      setIsQuizModalOpen(false)
      loadData()
      alert("Quiz asignado exitosamente")
    } catch (error) {
      console.error("Error guardando quiz:", error)
      alert("Error al guardar quiz")
    } finally {
      setSavingQuiz(false)
    }
  }

  if (!user) return null

  const myNotifications = notifications.filter(
    (n) => n.createdBy?.username === user.username
  )

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Panel del Docente
          </h1>
          <p className="text-white/80">
            Bienvenido, {user.nombre || user.username}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{myNotifications.length}</p>
                  <p className="text-sm text-blue-600">Tareas creadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl text-white">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {myNotifications.filter((n) => n.type === "quiz").length}
                  </p>
                  <p className="text-sm text-purple-600">Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{courses.length}</p>
                  <p className="text-sm text-green-600">Cursos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Crear Tarea */}
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
                      <Plus className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Crear Tarea</h3>
                      <p className="text-sm text-muted-foreground">
                        Asigna una nueva tarea o aviso
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tarea">Tarea</SelectItem>
                      <SelectItem value="aviso">Aviso</SelectItem>
                      <SelectItem value="recordatorio">Recordatorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Descripcion</Label>
                  <Textarea
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    placeholder="Describe la tarea..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nivel</Label>
                    <Select value={targetLevel} onValueChange={setTargetLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primaria">Primaria</SelectItem>
                        <SelectItem value="secundaria">Secundaria</SelectItem>
                        <SelectItem value="preparatoria">Preparatoria</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Grado</Label>
                    <Select value={targetGrade} onValueChange={setTargetGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Todos</SelectItem>
                        <SelectItem value="1">1°</SelectItem>
                        <SelectItem value="2">2°</SelectItem>
                        <SelectItem value="3">3°</SelectItem>
                        <SelectItem value="4">4°</SelectItem>
                        <SelectItem value="5">5°</SelectItem>
                        <SelectItem value="6">6°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateTask} 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  disabled={!taskText.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Crear Tarea
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Generar Quiz con IA */}
          <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-300">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Generar Quiz con IA</h3>
                      <p className="text-sm text-muted-foreground">
                        Crea un quiz automaticamente
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Generar Quiz con IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tema del Quiz</Label>
                  <div className="flex gap-2">
                    <Input
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="Ej: La Revolucion Francesa"
                    />
                    <Button
                      onClick={handleGenerateQuiz}
                      disabled={!quizTopic.trim() || generatingQuiz}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      {generatingQuiz ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {generatedQuiz && (
                  <>
                    <div className="border rounded-lg p-4 bg-purple-50">
                      <h4 className="font-semibold mb-3">Quiz Generado: {quizTopic}</h4>
                      <div className="space-y-4">
                        {generatedQuiz.map((q, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-sm mb-2">
                              {index + 1}. {q.pregunta}
                            </p>
                            <ul className="space-y-1">
                              {q.opciones.map((op, i) => (
                                <li
                                  key={i}
                                  className={`text-xs px-2 py-1 rounded ${
                                    i === q.respuestaCorrectaIndex
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  {op}
                                  {i === q.respuestaCorrectaIndex && " ✓"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nivel</Label>
                        <Select value={targetLevel} onValueChange={setTargetLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primaria">Primaria</SelectItem>
                            <SelectItem value="secundaria">Secundaria</SelectItem>
                            <SelectItem value="preparatoria">Preparatoria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Grado</Label>
                        <Select value={targetGrade} onValueChange={setTargetGrade}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1°</SelectItem>
                            <SelectItem value="2">2°</SelectItem>
                            <SelectItem value="3">3°</SelectItem>
                            <SelectItem value="4">4°</SelectItem>
                            <SelectItem value="5">5°</SelectItem>
                            <SelectItem value="6">6°</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveQuiz}
                      disabled={savingQuiz}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      {savingQuiz ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Asignar Quiz a Estudiantes
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Mis Tareas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : myNotifications.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No has creado tareas aun
              </p>
            ) : (
              <div className="space-y-3">
                {myNotifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {notification.type === "quiz" ? (
                        <Brain className="h-5 w-5 text-purple-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{notification.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.targetLevel} - {notification.targetGrade}° | 
                          {notification.completedBy?.length || 0} completados
                        </p>
                      </div>
                    </div>
                    <Badge variant={notification.type === "quiz" ? "default" : "secondary"}>
                      {notification.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
\`\`\`

---

### Paso 2.6: Subir cambios del frontend a GitHub

En la terminal, asegurate de estar en la carpeta frontend:

\`\`\`bash
cd C:\Users\Raul\Documents\asistente-escolar\frontend
\`\`\`

Ejecuta:

\`\`\`bash
git add .
git commit -m "Mejorar interfaz y agregar funcionalidades de quiz y consejos"
git push
\`\`\`

---

## PARTE 3: VERIFICAR DESPLIEGUE

### Paso 3.1: Verificar Render (Backend)

1. Ve a [render.com](https://render.com)
2. Entra a tu servicio
3. Verifica que el deploy este completo (status: Live)

### Paso 3.2: Verificar Vercel (Frontend)

1. Ve a [vercel.com](https://vercel.com)
2. Entra a tu proyecto
3. Verifica que el deploy automatico haya terminado

### Paso 3.3: Probar la aplicacion

1. Abre tu URL de Vercel
2. Inicia sesion como `profesor1` / `123456`
3. Crea un quiz con IA
4. Cierra sesion
5. Inicia sesion como `estudiante1` / `123456`
6. Verifica que puedas ver y responder el quiz
7. Prueba el boton de consejos de IA

---

## RESUMEN DE ARCHIVOS MODIFICADOS

### Backend (carpeta backend):
- `models/Notification.js` - Actualizado
- `index.js` - Agregar nuevas rutas

### Frontend (carpeta frontend):
- `lib/api.ts` - Actualizado
- `components/quiz-modal.tsx` - NUEVO
- `components/advice-card.tsx` - NUEVO
- `app/dashboard/student/page.tsx` - Actualizado
- `app/dashboard/teacher/page.tsx` - Actualizado

---

## ERRORES COMUNES

1. **Error "userId not defined"**: Verifica que el usuario este guardado en localStorage
2. **Quiz no se muestra**: Verifica que el backend tenga la ruta `/api/notifications/with-quiz`
3. **Consejos no funcionan**: Verifica que el backend tenga la ruta `/api/generate-advice`
4. **CORS error**: Verifica que el backend tenga `app.use(cors())` configurado
