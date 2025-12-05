"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getNotifications, type Notification } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, ClipboardList, Brain, Volume2, VolumeX, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudentDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [hasSpoken, setHasSpoken] = useState(false)

  const speakNotifications = useCallback(
    (notifs: Notification[], username: string) => {
      if (!speechEnabled || hasSpoken) return
      if (typeof window === "undefined" || !window.speechSynthesis) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const taskCount = notifs.filter((n) => n.type === "tarea").length
      const quizCount = notifs.filter((n) => n.type === "quiz").length

      let message = `Hola ${username}, tienes ${notifs.length} notificaciones nuevas.`

      if (taskCount > 0) {
        message += ` ${taskCount} ${taskCount === 1 ? "tarea" : "tareas"}.`
      }
      if (quizCount > 0) {
        message += ` ${quizCount} ${quizCount === 1 ? "quiz" : "quizzes"}.`
      }

      // Add notification titles
      if (notifs.length > 0 && notifs.length <= 5) {
        message += " Tus pendientes son: "
        notifs.forEach((n, i) => {
          message += `${i + 1}. ${n.text}. `
        })
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

      try {
        const data = await getNotifications(user.nivel, user.grado)
        setNotifications(data)

        // Trigger speech after data loads
        setTimeout(() => {
          speakNotifications(data, user.username)
        }, 500)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar notificaciones")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [speakNotifications])

  function toggleSpeech() {
    if (speechEnabled) {
      window.speechSynthesis?.cancel()
    }
    setSpeechEnabled(!speechEnabled)
  }

  function replayMessage() {
    const user = getUser()
    if (user) {
      setHasSpoken(false)
      setTimeout(() => {
        speakNotifications(notifications, user.username)
      }, 100)
    }
  }

  const tasks = notifications.filter((n) => n.type === "tarea")
  const quizzes = notifications.filter((n) => n.type === "quiz")

  return (
    <DashboardLayout requiredRole="estudiante">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
            <p className="text-gray-500 mt-1">Revisa tus tareas y notificaciones</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={replayMessage}
              disabled={!speechEnabled || notifications.length === 0}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Repetir
            </Button>
            <Button variant={speechEnabled ? "outline" : "secondary"} size="sm" onClick={toggleSpeech}>
              {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Pendientes</CardTitle>
              <Bell className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tareas</CardTitle>
              <ClipboardList className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Quizzes</CardTitle>
              <Brain className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse text-gray-400">Cargando notificaciones...</div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 text-center text-red-600">{error}</CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                  Tareas Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No tienes tareas pendientes</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100"
                      >
                        <BookOpen className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900 font-medium">{task.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(task.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Quizzes Programados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quizzes.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No tienes quizzes programados</p>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz._id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100"
                      >
                        <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900 font-medium">{quiz.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(quiz.date).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
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
