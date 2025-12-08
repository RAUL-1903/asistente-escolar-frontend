"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser, removeUser } from "@/lib/auth"
import type { User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut, UserIcon, Sparkles } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  const roleConfig = {
    admin: {
      gradient: "from-indigo-600 to-purple-600",
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      label: "Administrador",
    },
    docente: {
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Docente",
    },
    estudiante: {
      gradient: "from-orange-500 to-pink-500",
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "Estudiante",
    },
  }

  const config = roleConfig[user.role]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}
              >
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">EduAsistente</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Tu compañero de estudio
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-50 border border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">{user.nombre || user.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text} font-medium`}>
                    {config.label}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
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
