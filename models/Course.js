import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nombre del curso es requerido"],
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    color: {
      type: String,
      default: "#3B82F6", // Azul por defecto
    },
    descripcion: {
      type: String,
      trim: true,
    },
    nivel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria"],
    },
    grado: {
      type: Number,
      min: 1,
      max: 6,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model("Course", courseSchema)
