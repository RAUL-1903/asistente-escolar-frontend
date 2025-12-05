"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateTaskModal } from "@/components/create-task-modal"
import { QuizGenerator } from "@/components/quiz-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Brain, BookOpen, Users } from "lucide-react"

export default function TeacherDashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showQuizGenerator, setShowQuizGenerator] = useState(false)

  return (
    <DashboardLayout requiredRole="docente">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel del Docente</h1>
          <p className="text-gray-500 mt-1">Gestiona tareas y genera quizzes con IA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Mis Cursos</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-gray-500">Asignados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Estudiantes</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
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
        </div>

        {/* Quiz Generator Section */}
        {showQuizGenerator && <QuizGenerator onClose={() => setShowQuizGenerator(false)} />}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} />
    </DashboardLayout>
  )
}
