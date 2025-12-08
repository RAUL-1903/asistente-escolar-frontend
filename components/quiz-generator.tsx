"use client"

import type React from "react"
import { useState } from "react"
import { generateQuiz, generateAdvice, createNotification, type QuizQuestion, type AIAdvice } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, Loader2, X, CheckCircle, Circle, Lightbulb, Sparkles, BookOpen, Send, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuizGeneratorProps {
  onClose: () => void
}

export function QuizGenerator({ onClose }: QuizGeneratorProps) {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [advice, setAdvice] = useState<AIAdvice | null>(null)
  const [error, setError] = useState("")
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  // Assignment state
  const [showAssign, setShowAssign] = useState(false)
  const [targetLevel, setTargetLevel] = useState("")
  const [targetGrade, setTargetGrade] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError("")
    setQuestions([])
    setAdvice(null)
    setSelectedAnswers({})
    setShowResults(false)
    setShowAssign(false)
    setAssigned(false)

    try {
      const [quizResult, adviceResult] = await Promise.all([
        generateQuiz(topic),
        generateAdvice(topic).catch(() => null),
      ])
      setQuestions(quizResult)
      if (adviceResult) {
        setAdvice(adviceResult)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar quiz")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateAdviceOnly() {
    if (!topic.trim()) return
    setLoadingAdvice(true)
    try {
      const adviceResult = await generateAdvice(topic)
      setAdvice(adviceResult)
    } catch (err) {
      // Silently fail for advice
    } finally {
      setLoadingAdvice(false)
    }
  }

  function handleSelectAnswer(questionIndex: number, optionIndex: number) {
    if (showResults) return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  function handleCheckAnswers() {
    setShowResults(true)
  }

  function getScore() {
    let correct = 0
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.respuestaCorrectaIndex) {
        correct++
      }
    })
    return correct
  }

  async function handleAssignQuiz() {
    if (!targetLevel || !targetGrade) return
    setAssigning(true)

    try {
      const user = getUser()
      await createNotification({
        text: topic,
        type: "quiz",
        targetLevel,
        targetGrade: Number.parseInt(targetGrade),
        createdBy: user?._id,
      })
      setAssigned(true)
    } catch (err) {
      setError("Error al asignar quiz")
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Card className="relative border-0 shadow-xl bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 hover:bg-red-50 hover:text-red-500"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl">Generador de Quiz con IA</span>
            <p className="text-sm text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3 text-purple-500" />
              Incluye consejos de estudio
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleGenerate} className="flex gap-3">
          <Input
            placeholder="Ingresa el tema (ej: Revolución Francesa, Fracciones...)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            className="flex-1 h-11 bg-slate-50 border-slate-200 focus:border-purple-400"
          />
          <Button
            type="submit"
            disabled={loading || !topic.trim()}
            className="gradient-primary text-white shadow-lg shadow-purple-500/25 h-11 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar
              </>
            )}
          </Button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl gradient-primary opacity-50 animate-pulse-ring" />
            </div>
            <p className="mt-6 text-foreground font-medium">La IA está generando el quiz...</p>
            <p className="text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">{error}</div>}

        {/* AI Advice Section */}
        {advice && (
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-amber-800">Consejos de la IA sobre: {topic}</h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-2">Resumen:</p>
                <p className="text-sm text-amber-900 bg-white/50 rounded-lg p-3">{advice.summary}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-amber-700 mb-2">Tips de estudio:</p>
                <ul className="space-y-1">
                  {advice.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {advice.resources.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-2">Recursos sugeridos:</p>
                  <ul className="space-y-1">
                    {advice.resources.map((resource, i) => (
                      <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!advice && questions.length > 0 && (
          <Button
            variant="outline"
            onClick={handleGenerateAdviceOnly}
            disabled={loadingAdvice}
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 bg-transparent"
          >
            {loadingAdvice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            Obtener consejos de estudio
          </Button>
        )}

        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Quiz: {topic}
              </h3>
              {showResults && (
                <span
                  className={`text-lg font-bold px-3 py-1 rounded-full ${
                    getScore() >= questions.length / 2
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {getScore()}/{questions.length}
                </span>
              )}
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="rounded-xl border border-slate-200 p-5 space-y-3 bg-slate-50/50">
                <p className="font-medium text-foreground">
                  {qIndex + 1}. {question.pregunta}
                </p>
                <div className="grid gap-2">
                  {question.opciones.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === oIndex
                    const isCorrect = question.respuestaCorrectaIndex === oIndex

                    let optionClass =
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer"

                    if (showResults) {
                      if (isCorrect) {
                        optionClass += " border-emerald-500 bg-emerald-50"
                      } else if (isSelected && !isCorrect) {
                        optionClass += " border-red-500 bg-red-50"
                      } else {
                        optionClass += " border-slate-200 bg-white"
                      }
                    } else if (isSelected) {
                      optionClass += " border-purple-500 bg-purple-50"
                    } else {
                      optionClass += " border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                    }

                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => handleSelectAnswer(qIndex, oIndex)}
                        className={optionClass}
                        disabled={showResults}
                      >
                        {showResults && isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle
                            className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-purple-600" : "text-slate-300"}`}
                          />
                        )}
                        <span className="text-sm">{option}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {!showResults && Object.keys(selectedAnswers).length === questions.length && (
              <Button onClick={handleCheckAnswers} className="w-full gradient-success text-white shadow-lg h-11">
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar Respuestas
              </Button>
            )}

            {showResults && !showAssign && !assigned && (
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setQuestions([])
                    setTopic("")
                    setSelectedAnswers({})
                    setShowResults(false)
                    setAdvice(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nuevo Quiz
                </Button>
                <Button onClick={() => setShowAssign(true)} className="flex-1 gradient-primary text-white">
                  <Send className="mr-2 h-4 w-4" />
                  Asignar a Estudiantes
                </Button>
              </div>
            )}

            {showAssign && !assigned && (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
                <h4 className="font-medium text-purple-800">Asignar quiz a estudiantes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-purple-700">Nivel</Label>
                    <Select value={targetLevel} onValueChange={setTargetLevel}>
                      <SelectTrigger className="bg-white">
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
                    <Label className="text-purple-700">Grado</Label>
                    <Select value={targetGrade} onValueChange={setTargetGrade}>
                      <SelectTrigger className="bg-white">
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
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAssign(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAssignQuiz}
                    disabled={!targetLevel || !targetGrade || assigning}
                    className="flex-1 gradient-primary text-white"
                  >
                    {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Asignar
                  </Button>
                </div>
              </div>
            )}

            {assigned && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-emerald-800">Quiz asignado correctamente</p>
                <p className="text-sm text-emerald-600">Los estudiantes ya pueden verlo en su dashboard</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
