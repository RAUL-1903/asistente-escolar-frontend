// API Configuration - connects to your backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Types
export interface User {
  _id: string
  username: string
  role: "admin" | "docente" | "estudiante"
  nivel?: string
  grado?: number
  nombre?: string
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
  date: string
  targetLevel: string
  targetGrade: number
  isCompleted?: boolean
  quizData?: QuizQuestion[]
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

export async function login(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al iniciar sesión")
  }

  return data.user
}

export async function getNotifications(nivel: string, grado: number): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/notifications/${nivel}/${grado}`)
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
  quizData?: QuizQuestion[]
}): Promise<Notification> {
  const res = await fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationData),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al crear notificación")
  }

  return data.notification
}

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

export async function getUsers(role?: string): Promise<User[]> {
  const url = role ? `${API_URL}/users?role=${role}` : `${API_URL}/users`
  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error("Error al obtener usuarios")
  }

  return data.users
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

export async function createCourse(courseData: {
  name: string
  teacherId: string
  color: string
  nivel: string
  grado: number
}) {
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

export async function getCourses() {
  const res = await fetch(`${API_URL}/courses`)
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error("Error al obtener cursos")
  }

  return data.courses
}
