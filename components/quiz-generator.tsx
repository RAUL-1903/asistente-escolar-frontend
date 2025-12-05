"use client"

import type React from "react"

import { useState } from "react"
import { generateQuiz, type QuizQuestion } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Loader2, X, CheckCircle, Circle } from "lucide-react"

interface QuizGeneratorProps {
  onClose: () => void
}

export function QuizGenerator({ onClose }: QuizGeneratorProps) {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [error, setError] = useState("")
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError("")
    setQuestions([])
    setSelectedAnswers({})
    setShowResults(false)

    try {
      const result = await generateQuiz(topic)
      setQuestions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar quiz")
    } finally {
      setLoading(false)
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

  return (
    <Card className="relative">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Generador de Quiz con IA
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleGenerate} className="flex gap-3">
          <Input
            placeholder="Ingresa el tema (ej: Revolución Francesa, Fracciones...)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !topic.trim()} className="bg-purple-600 hover:bg-purple-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar"
            )}
          </Button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-300" />
              <div className="absolute inset-0 animate-ping">
                <Brain className="h-16 w-16 text-purple-500 opacity-50" />
              </div>
            </div>
            <p className="mt-4 text-gray-500">La IA está generando las preguntas...</p>
            <p className="text-sm text-gray-400">Esto puede tomar unos segundos</p>
          </div>
        )}

        {error && <div className="rounded-md bg-red-50 p-4 text-red-600">{error}</div>}

        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Quiz: {topic}</h3>
              {showResults && (
                <span className="text-lg font-bold text-purple-600">
                  Puntuación: {getScore()}/{questions.length}
                </span>
              )}
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <p className="font-medium text-gray-900">
                  {qIndex + 1}. {question.pregunta}
                </p>
                <div className="grid gap-2">
                  {question.opciones.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === oIndex
                    const isCorrect = question.respuestaCorrectaIndex === oIndex

                    let optionClass = "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                    if (showResults) {
                      if (isCorrect) {
                        optionClass = "border-green-500 bg-green-50"
                      } else if (isSelected && !isCorrect) {
                        optionClass = "border-red-500 bg-red-50"
                      }
                    } else if (isSelected) {
                      optionClass = "border-purple-500 bg-purple-50"
                    }

                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => handleSelectAnswer(qIndex, oIndex)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${optionClass}`}
                        disabled={showResults}
                      >
                        {showResults && isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle
                            className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-purple-600" : "text-gray-300"}`}
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
              <Button onClick={handleCheckAnswers} className="w-full bg-green-600 hover:bg-green-700">
                Verificar Respuestas
              </Button>
            )}

            {showResults && (
              <Button
                onClick={() => {
                  setQuestions([])
                  setTopic("")
                  setSelectedAnswers({})
                  setShowResults(false)
                }}
                variant="outline"
                className="w-full"
              >
                Generar Nuevo Quiz
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
