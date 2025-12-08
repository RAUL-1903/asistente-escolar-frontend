/**
 * Script para crear datos iniciales en la base de datos
 * Ejecutar con: node scripts/seed-database.js
 */

import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"

dotenv.config()

// Esquemas inline para el script
const userSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
    role: String,
    nivel: String,
    grado: Number,
    nombre: String,
  },
  { timestamps: true },
)

const courseSchema = new mongoose.Schema(
  {
    name: String,
    teacherId: mongoose.Schema.Types.ObjectId,
    color: String,
    nivel: String,
    grado: Number,
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)
const Course = mongoose.model("Course", courseSchema)

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("✅ Conectado a MongoDB")

    // Limpiar colecciones
    await User.deleteMany({})
    await Course.deleteMany({})
    console.log("🗑️  Colecciones limpiadas")

    // Hash para passwords
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Crear usuarios
    const admin = await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      nombre: "Administrador",
    })

    const docente = await User.create({
      username: "profesor1",
      password: hashedPassword,
      role: "docente",
      nombre: "María García",
    })

    const estudiante1 = await User.create({
      username: "estudiante1",
      password: hashedPassword,
      role: "estudiante",
      nivel: "secundaria",
      grado: 2,
      nombre: "Juan Pérez",
    })

    const estudiante2 = await User.create({
      username: "estudiante2",
      password: hashedPassword,
      role: "estudiante",
      nivel: "primaria",
      grado: 5,
      nombre: "Ana López",
    })

    console.log("👥 Usuarios creados")

    // Crear cursos
    await Course.create([
      { name: "Matemáticas", teacherId: docente._id, color: "#EF4444", nivel: "secundaria", grado: 2 },
      { name: "Historia", teacherId: docente._id, color: "#F59E0B", nivel: "secundaria", grado: 2 },
      { name: "Ciencias", teacherId: docente._id, color: "#10B981", nivel: "primaria", grado: 5 },
      { name: "Español", teacherId: docente._id, color: "#3B82F6", nivel: "primaria", grado: 5 },
    ])

    console.log("📚 Cursos creados")

    console.log(`
    ✅ Base de datos sembrada exitosamente!
    
    Usuarios de prueba (password: 123456):
    • admin      - Administrador
    • profesor1  - Docente
    • estudiante1 - Estudiante (secundaria, grado 2)
    • estudiante2 - Estudiante (primaria, grado 5)
    `)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

seed()
