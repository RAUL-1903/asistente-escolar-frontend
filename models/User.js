import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username es requerido"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password es requerido"],
      minlength: 4,
    },
    role: {
      type: String,
      enum: ["admin", "docente", "estudiante"],
      default: "estudiante",
    },
    nivel: {
      type: String,
      enum: ["primaria", "secundaria", "preparatoria"],
      required: function () {
        return this.role === "estudiante"
      },
    },
    grado: {
      type: Number,
      min: 1,
      max: 6,
      required: function () {
        return this.role === "estudiante"
      },
    },
    nombre: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Método para comparar passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Excluir password al convertir a JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model("User", userSchema)
