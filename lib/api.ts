// API Configuration - connects to your backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Types
export interface User {
  _id: string
  username: string
  role: "admin" | "docente" | "estudiante"
  nivel?: string
  grado?: number
}

export interface Notification {
  _id: string
  text: string
  type: "tarea" | "quiz"
  courseId?: string
  date: string
  targetLevel: string
  targetGrade: number
}

export interface QuizQuestion {
  pregunta: string
  opciones: string[]
  respuestaCorrectaIndex: number
}

// API Functions
export async function login(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al iniciar sesión")
  }

  return res.json()
}

export async function getNotifications(nivel: string, grado: number): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/notifications/${nivel}/${grado}`)

  if (!res.ok) {
    throw new Error("Error al obtener notificaciones")
  }

  return res.json()
}

export async function createNotification(data: {
  text: string
  type: "tarea" | "quiz"
  targetLevel: string
  targetGrade: number
  courseId?: string
}): Promise<Notification> {
  const res = await fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("Error al crear notificación")
  }

  return res.json()
}

export async function generateQuiz(topic: string): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_URL}/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al generar quiz")
  }

  return res.json()
}
