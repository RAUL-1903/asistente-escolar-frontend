"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, removeUser } from "@/lib/auth"
import type { User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut, UserIcon } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "docente" | "estudiante"
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentUser = getUser()

    if (!currentUser) {
      router.push("/login")
      return
    }

    if (requiredRole && currentUser.role !== requiredRole) {
      router.push("/login")
      return
    }

    setUser(currentUser)
  }, [router, requiredRole])

  function handleLogout() {
    removeUser()
    router.push("/login")
  }

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    )
  }

  const roleColors = {
    admin: "bg-purple-100 text-purple-700",
    docente: "bg-green-100 text-green-700",
    estudiante: "bg-amber-100 text-amber-700",
  }

  const roleLabels = {
    admin: "Administrador",
    docente: "Docente",
    estudiante: "Estudiante",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Asistente Escolar</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.username}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
