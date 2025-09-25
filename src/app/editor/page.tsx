"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sparkles, Mic, MicOff, Palette, Save, Share2 } from "lucide-react"
import Link from "next/link"

export default function EditorPage() {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setTimeout(() => {
      setGeneratedImage("/images/sample-nail-design.jpg")
      setIsGenerating(false)
    }, 3000)
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
  }

  if (!session) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Acceso Requerido</h1>
        <p className="text-gray-600">
          Necesitas iniciar sesión para usar el editor de diseños IA.
        </p>
        <Link href="/api/auth/signin">
          <Button variant="lobba" size="lg">
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold lobba-text-gradient">
          Editor de Diseños IA
        </h1>
        <p className="text-gray-600">
          Describe tu diseño ideal y nuestra IA lo creará para ti
        </p>
      </div>

      {/* AI Generation Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          Generación con IA
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe tu diseño ideal... (ej: uñas francesas con flores rosas y detalles dorados)"
              className="w-full p-4 border rounded-lg resize-none h-32 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              maxLength={250}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">
              {prompt.length}/250
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleGenerateAI}
              disabled={!prompt.trim() || isGenerating}
              variant="lobba"
              size="lg"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Diseño IA
                </>
              )}
            </Button>

            <Button
              onClick={toggleVoiceInput}
              variant={isListening ? "destructive" : "outline"}
              size="lg"
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Detener
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Voz
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Generated Result */}
        {generatedImage && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tu Diseño Generado</h3>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-64 h-64 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Palette className="h-16 w-16 text-pink-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Diseño generado basado en: &quot;{prompt}&quot;
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Limits */}
      <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
        <h3 className="font-semibold text-pink-800 mb-2">Límites Mensuales</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Diseños IA de uñas:</span>
            <span className="font-medium">23/100 usados</span>
          </div>
          <div className="w-full bg-pink-200 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: '23%' }}></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/catalog">
          <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
            <Palette className="h-8 w-8 text-purple-500 mb-3" />
            <h3 className="font-semibold mb-2">Ver Catálogo</h3>
            <p className="text-sm text-gray-600">
              Explora diseños de la comunidad
            </p>
          </div>
        </Link>

        <Link href="/hairstyle">
          <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
            <Sparkles className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-2">Prueba Peinados</h3>
            <p className="text-sm text-gray-600">
              Experimenta con estilos de cabello
            </p>
          </div>
        </Link>

        <Link href="/salons">
          <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-green-500 font-bold text-sm">S</span>
            </div>
            <h3 className="font-semibold mb-2">Encontrar Salón</h3>
            <p className="text-sm text-gray-600">
              Reserva cita para aplicar tu diseño
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
