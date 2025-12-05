import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Texto de notificación es requerido"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["tarea", "quiz", "aviso", "recordatorio"],
      default: "aviso",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date, // Fecha límite para tareas
    },
    targetLevel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria", "todos"],
      default: "todos",
    },
    targetGrade: {
      type: Number,
      min: 0, // 0 = todos los grados
      max: 6,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index para búsquedas eficientes
notificationSchema.index({ targetLevel: 1, targetGrade: 1, isActive: 1 })

export default mongoose.model("Notification", notificationSchema)
