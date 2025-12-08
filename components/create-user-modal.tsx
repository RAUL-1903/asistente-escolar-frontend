"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/lib/api"

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  onUserCreated: () => void
  allowedRoles?: ("admin" | "docente" | "estudiante")[]
}

export function CreateUserModal({
  open,
  onClose,
  onUserCreated,
  allowedRoles = ["admin", "docente", "estudiante"],
}: CreateUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    nombre: "",
    role: "" as "admin" | "docente" | "estudiante",
    nivel: "",
    grado: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await createUser({
        username: formData.username,
        password: formData.password,
        nombre: formData.nombre,
        role: formData.role,
        nivel: formData.role === "estudiante" ? formData.nivel : undefined,
        grado: formData.role === "estudiante" ? formData.grado : undefined,
      })

      setFormData({ username: "", password: "", nombre: "", role: "" as any, nivel: "", grado: 1 })
      onUserCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || "Error al crear usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Juan Perez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="juanperez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="******"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "docente" | "estudiante") => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.includes("admin") && <SelectItem value="admin">Administrador</SelectItem>}
                {allowedRoles.includes("docente") && <SelectItem value="docente">Docente</SelectItem>}
                {allowedRoles.includes("estudiante") && <SelectItem value="estudiante">Estudiante</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {formData.role === "estudiante" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel</Label>
                <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="secundaria">Secundaria</SelectItem>
                    <SelectItem value="preparatoria">Preparatoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grado">Grado</Label>
                <Select
                  value={formData.grado.toString()}
                  onValueChange={(value) => setFormData({ ...formData, grado: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <SelectItem key={g} value={g.toString()}>
                        {g}° Grado
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
