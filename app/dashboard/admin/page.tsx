"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateUserModal } from "@/components/create-user-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, BookOpen, Bell, UserPlus } from "lucide-react"
import { getUsers, getCourses, type User } from "@/lib/api"

export default function AdminDashboard() {
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [usersData, coursesData] = await Promise.all([getUsers(), getCourses()])
      setUsers(usersData)
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      docente: "bg-blue-100 text-blue-700",
      estudiante: "bg-green-100 text-green-700",
    }
    const labels: Record<string, string> = {
      admin: "Admin",
      docente: "Docente",
      estudiante: "Estudiante",
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>{labels[role]}</span>
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administracion</h1>
            <p className="text-gray-500 mt-1">Gestiona usuarios y cursos del sistema</p>
          </div>
          <Button onClick={() => setShowCreateUser(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Usuarios</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500">Total registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Docentes</CardTitle>
              <BookOpen className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "docente").length}</div>
              <p className="text-xs text-gray-500">Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Estudiantes</CardTitle>
              <Bell className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.role === "estudiante").length}</div>
              <p className="text-xs text-gray-500">Registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Cursos</CardTitle>
              <Shield className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-gray-500">Creados</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500">No hay usuarios registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nivel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Grado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.nombre || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{user.username}</td>
                        <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-3 px-4 text-gray-600 capitalize">{user.nivel || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{user.grado || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateUserModal open={showCreateUser} onClose={() => setShowCreateUser(false)} onUserCreated={fetchData} />
    </DashboardLayout>
  )
}
