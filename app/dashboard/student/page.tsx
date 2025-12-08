"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  getNotifications,
  generateQuiz,
  generateAdvice,
  type Notification,
  type QuizQuestion,
  type AIAdvice,
} from "@/lib/api"
import { getUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bell,
  ClipboardList,
  Brain,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  Circle,
  Trophy,
  Sparkles,
  X,
  Clock,
  Camera,
  User,
  Lightbulb,
  Loader2,
  BookMarked,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StudentDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [hasSpoken, setHasSpoken] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<{
    notification: Notification
    questions: QuizQuestion[]
  } | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)

  const [showAdviceModal, setShowAdviceModal] = useState(false)
  const [adviceTopic, setAdviceTopic] = useState("")
  const [advice, setAdvice] = useState<AIAdvice | null>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  const speakNotifications = useCallback(
    (notifs: Notification[], username: string) => {
      if (!speechEnabled || hasSpoken) return
      if (typeof window === "undefined" || !window.speechSynthesis) return

      window.speechSynthesis.cancel()

      const taskCount = notifs.filter((n) => n.type === "tarea").length
      const quizCount = notifs.filter((n) => n.type === "quiz").length

      let message = `Hola ${username}, tienes ${notifs.length} notificaciones.`

      if (taskCount > 0) {
        message += ` ${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}.`
      }
      if (quizCount > 0) {
        message += ` ${quizCount} ${quizCount === 1 ? "quiz" : "quizzes"}.`
      }

      const utterance = new SpeechSynthesisUtterance(message)
      utterance.lang = "es-ES"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
      setHasSpoken(true)
    },
    [speechEnabled, hasSpoken],
  )

  useEffect(() => {
    async function fetchData() {
      const user = getUser()
      if (!user || !user.nivel || !user.grado) {
        setError("Información de usuario incompleta")
        setLoading(false)
        return
      }

      const savedPhoto = localStorage.getItem(`photo_${user._id}`)
      if (savedPhoto) {
        setProfilePhoto(savedPhoto)
      }

      try {
        const data = await getNotifications(user.nivel, user.grado)
        setNotifications(data)

        const saved = localStorage.getItem(`completed_${user._id}`)
        if (saved) {
          setCompletedTasks(new Set(JSON.parse(saved)))
        }

        setTimeout(() => {
          speakNotifications(data, user.nombre || user.username)
        }, 500)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar notificaciones")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [speakNotifications])

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setProfilePhoto(base64)
      const user = getUser()
      if (user) {
        localStorage.setItem(`photo_${user._id}`, base64)
      }
    }
    reader.readAsDataURL(file)
  }

  function toggleSpeech() {
    if (speechEnabled) {
      window.speechSynthesis?.cancel()
    }
    setSpeechEnabled(!speechEnabled)
  }

  function toggleTaskComplete(taskId: string) {
    const user = getUser()
    if (!user) return

    setCompletedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      localStorage.setItem(`completed_${user._id}`, JSON.stringify([...newSet]))
      return newSet
    })
  }

  async function startQuiz(notification: Notification) {
    setLoadingQuiz(true)
    try {
      const questions = await generateQuiz(notification.text)
      setActiveQuiz({ notification, questions })
      setQuizAnswers({})
      setQuizSubmitted(false)
    } catch (err) {
      setError("Error al cargar el quiz")
    } finally {
      setLoadingQuiz(false)
    }
  }

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
  }

  function submitQuiz() {
    setQuizSubmitted(true)
  }

  function getQuizScore(): number {
    if (!activeQuiz) return 0
    let correct = 0
    activeQuiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.respuestaCorrectaIndex) {
        correct++
      }
    })
    return correct
  }

  function closeQuiz() {
    if (quizSubmitted && activeQuiz) {
      toggleTaskComplete(activeQuiz.notification._id)
    }
    setActiveQuiz(null)
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  async function handleGetAdvice() {
    if (!adviceTopic.trim()) return

    setLoadingAdvice(true)
    try {
      const result = await generateAdvice(adviceTopic)
      setAdvice(result)
    } catch (err) {
      setError("Error al obtener consejos")
    } finally {
      setLoadingAdvice(false)
    }
  }

  function closeAdviceModal() {
    setShowAdviceModal(false)
    setAdvice(null)
    setAdviceTopic("")
  }

  const tasks = notifications.filter((n) => n.type === "tarea")
  const quizzes = notifications.filter((n) => n.type === "quiz")
  const completedCount = [...completedTasks].filter((id) => notifications.some((n) => n._id === id)).length
  const pendingCount = notifications.length - completedCount
  const user = getUser()

  return (
    <DashboardLayout requiredRole="estudiante">
      {/* Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Quiz: {activeQuiz.notification.text}</CardTitle>
                    {quizSubmitted && (
                      <p className="text-sm text-gray-500">
                        Puntuacion: {getQuizScore()}/{activeQuiz.questions.length}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeQuiz}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {quizSubmitted && (
                <div
                  className={`p-4 rounded-xl flex items-center gap-3 ${
                    getQuizScore() >= activeQuiz.questions.length / 2
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}
                >
                  <Trophy
                    className={`h-8 w-8 ${
                      getQuizScore() >= activeQuiz.questions.length / 2 ? "text-emerald-500" : "text-amber-500"
                    }`}
                  />
                  <div>
                    <p className="font-semibold">
                      {getQuizScore() >= activeQuiz.questions.length / 2 ? "Excelente trabajo!" : "Sigue practicando!"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Obtuviste {getQuizScore()} de {activeQuiz.questions.length} respuestas correctas
                    </p>
                  </div>
                </div>
              )}

              {activeQuiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="space-y-3">
                  <p className="font-medium text-gray-800">
                    {qIndex + 1}. {question.pregunta}
                  </p>
                  <div className="grid gap-2">
                    {question.opciones.map((option, oIndex) => {
                      const isSelected = quizAnswers[qIndex] === oIndex
                      const isCorrect = question.respuestaCorrectaIndex === oIndex

                      let className =
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer"

                      if (quizSubmitted) {
                        if (isCorrect) {
                          className += " border-emerald-500 bg-emerald-50"
                        } else if (isSelected && !isCorrect) {
                          className += " border-red-500 bg-red-50"
                        } else {
                          className += " border-gray-200 bg-gray-50"
                        }
                      } else if (isSelected) {
                        className += " border-purple-500 bg-purple-50"
                      } else {
                        className += " border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                      }

                      return (
                        <button
                          key={oIndex}
                          type="button"
                          onClick={() => selectAnswer(qIndex, oIndex)}
                          className={className}
                          disabled={quizSubmitted}
                        >
                          {quizSubmitted && isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle
                              className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-purple-600" : "text-gray-300"}`}
                            />
                          )}
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!quizSubmitted && Object.keys(quizAnswers).length === activeQuiz.questions.length && (
                <Button
                  onClick={submitQuiz}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enviar Respuestas
                </Button>
              )}

              {quizSubmitted && (
                <Button
                  onClick={closeQuiz}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  Cerrar y Marcar Completado
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showAdviceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <CardHeader className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Consejos de Estudio</CardTitle>
                    <p className="text-sm text-gray-500">Preguntale a la IA sobre cualquier tema</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={closeAdviceModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un tema (ej: Revolucion Francesa, Fracciones, Fotosintesis...)"
                  value={adviceTopic}
                  onChange={(e) => setAdviceTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGetAdvice()}
                  className="flex-1"
                />
                <Button
                  onClick={handleGetAdvice}
                  disabled={loadingAdvice || !adviceTopic.trim()}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                >
                  {loadingAdvice ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                </Button>
              </div>

              {loadingAdvice && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
                  <p className="text-gray-500">Generando consejos...</p>
                </div>
              )}

              {advice && !loadingAdvice && (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4" />
                      Resumen
                    </h3>
                    <p className="text-gray-700">{advice.summary}</p>
                  </div>

                  {/* Tips */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <h3 className="font-semibold text-emerald-800 flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4" />
                      Consejos para estudiar
                    </h3>
                    <ul className="space-y-2">
                      {advice.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recursos */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                    <h3 className="font-semibold text-indigo-800 flex items-center gap-2 mb-3">
                      <BookMarked className="h-4 w-4" />
                      Recursos recomendados
                    </h3>
                    <ul className="space-y-2">
                      {advice.resources.map((resource, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Foto de perfil */}
            <div className="relative group">
              <div
                className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center overflow-hidden shadow-lg cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto || "/placeholder.svg"}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                Mi Espacio de Aprendizaje
                <Sparkles className="h-7 w-7 text-orange-500" />
              </h1>
              <p className="text-gray-500 mt-1">Hola {user?.nombre || user?.username}, revisa tus actividades</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAdviceModal(true)}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Pedir Consejos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasSpoken(false)
                const user = getUser()
                if (user) speakNotifications(notifications, user.nombre || user.username)
              }}
              disabled={!speechEnabled || notifications.length === 0}
              className="border-purple-200 hover:bg-purple-50"
            >
              <Volume2 className="h-4 w-4 mr-2 text-purple-600" />
              Repetir
            </Button>
            <Button
              variant={speechEnabled ? "outline" : "secondary"}
              size="sm"
              onClick={toggleSpeech}
              className={speechEnabled ? "border-purple-200" : ""}
            >
              {speechEnabled ? <Volume2 className="h-4 w-4 text-purple-600" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">Total Pendientes</CardTitle>
              <Bell className="h-5 w-5 text-indigo-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400 to-pink-500 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Tareas</CardTitle>
              <ClipboardList className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cyan-100">Quizzes</CardTitle>
              <Brain className="h-5 w-5 text-cyan-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Completadas</CardTitle>
              <Trophy className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-500">Cargando tus actividades...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-center text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* Tasks and Quizzes */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <ClipboardList className="h-5 w-5" />
                  Tareas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-gray-500">No tienes tareas pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const isCompleted = completedTasks.has(task._id)
                      return (
                        <div
                          key={task._id}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            isCompleted
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-white border-orange-100 hover:border-orange-300"
                          }`}
                        >
                          <button
                            onClick={() => toggleTaskComplete(task._id)}
                            className={`mt-0.5 flex-shrink-0 transition-colors ${
                              isCompleted ? "text-emerald-500" : "text-orange-300 hover:text-orange-500"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
                            >
                              {task.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                {new Date(task.date).toLocaleDateString("es-ES", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                              {task.courseId && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: task.courseId.color + "20", color: task.courseId.color }}
                                >
                                  {task.courseId.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quizzes */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Brain className="h-5 w-5" />
                  Quizzes Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <Brain className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-gray-500">No tienes quizzes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => {
                      const isCompleted = completedTasks.has(quiz._id)
                      return (
                        <div
                          key={quiz._id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCompleted
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-white border-purple-100 hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p
                                className={`font-medium ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
                              >
                                {quiz.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                  {new Date(quiz.date).toLocaleDateString("es-ES", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </p>
                              </div>
                            </div>
                            {!isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => startQuiz(quiz)}
                                disabled={loadingQuiz}
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                              >
                                {loadingQuiz ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Brain className="h-4 w-4 mr-1" />
                                    Iniciar
                                  </>
                                )}
                              </Button>
                            )}
                            {isCompleted && (
                              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completado
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
