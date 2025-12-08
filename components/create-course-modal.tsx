"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCourse } from "@/lib/api"

interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
  onCourseCreated: () => void
  teacherId: string
}

const COLORS = [
  { name: "Rojo", value: "#EF4444" },
  { name: "Naranja", value: "#F59E0B" },
  { name: "Verde", value: "#10B981" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Morado", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
]

export function CreateCourseModal({ open, onClose, onCourseCreated, teacherId }: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    nivel: "",
    grado: 1,
    color: "#3B82F6",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await createCourse({
        name: formData.name,
        teacherId,
        nivel: formData.nivel,
        grado: formData.grado,
        color: formData.color,
      })

      setFormData({ name: "", nivel: "", grado: 1, color: "#3B82F6" })
      onCourseCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || "Error al crear curso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Salon/Curso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Curso</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Matematicas"
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label>Color del Curso</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === color.value ? "border-gray-900 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              {loading ? "Creando..." : "Crear Curso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
