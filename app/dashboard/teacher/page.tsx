"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateTaskModal } from "@/components/create-task-modal"
import { CreateCourseModal } from "@/components/create-course-modal"
import { CreateUserModal } from "@/components/create-user-modal"
import { QuizGenerator } from "@/components/quiz-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Brain, BookOpen, Users, Plus, UserPlus } from "lucide-react"
import { getCourses, getUsers } from "@/lib/api"
import { getUser } from "@/lib/auth"

export default function TeacherDashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showQuizGenerator, setShowQuizGenerator] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchData = async () => {
    try {
      const user = getUser()
      setCurrentUser(user)
      const [coursesData, studentsData] = await Promise.all([getCourses(), getUsers("estudiante")])
      setCourses(coursesData)
      setStudents(studentsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DashboardLayout requiredRole="docente">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel del Docente</h1>
          <p className="text-gray-500 mt-1">Gestiona tus cursos, tareas y estudiantes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Mis Cursos</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-gray-500">Asignados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Estudiantes</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tareas</CardTitle>
              <ClipboardList className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500">Publicadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Quizzes IA</CardTitle>
              <Brain className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-gray-500">Generados</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Crear Nueva Tarea
              </CardTitle>
              <CardDescription>Publica una tarea o aviso para tus estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowTaskModal(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                Crear Tarea
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Generar Quiz con IA
              </CardTitle>
              <CardDescription>Usa inteligencia artificial para crear preguntas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowQuizGenerator(true)} className="w-full bg-purple-600 hover:bg-purple-700">
                Generar Quiz
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-green-200 hover:border-green-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Crear Salon/Curso
              </CardTitle>
              <CardDescription>Agrega un nuevo curso para un grado especifico</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCourseModal(true)} className="w-full bg-green-600 hover:bg-green-700">
                Crear Curso
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-amber-200 hover:border-amber-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Agregar Estudiante
              </CardTitle>
              <CardDescription>Registra un nuevo estudiante en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowStudentModal(true)} className="w-full bg-amber-600 hover:bg-amber-700">
                Agregar Estudiante
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-gray-500">No tienes cursos asignados. Crea uno nuevo.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="p-4 rounded-lg border flex items-center gap-3"
                    style={{ borderLeftWidth: 4, borderLeftColor: course.color }}
                  >
                    <div>
                      <h3 className="font-medium">{course.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {course.nivel} - {course.grado}° Grado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Generator Section */}
        {showQuizGenerator && <QuizGenerator onClose={() => setShowQuizGenerator(false)} />}
      </div>

      {/* Modals */}
      <CreateTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} />

      {currentUser && (
        <CreateCourseModal
          open={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onCourseCreated={fetchData}
          teacherId={currentUser._id}
        />
      )}

      <CreateUserModal
        open={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onUserCreated={fetchData}
        allowedRoles={["estudiante"]}
      />
    </DashboardLayout>
  )
}
