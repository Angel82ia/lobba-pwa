import { useState, useEffect } from 'react'
import { generateNailDesign, getQuota, requestSpeechRecognition } from '../../services/ai'
import { Card, Button, Textarea, Alert } from '../../components/common'

const NailsGenerator = () => {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)
  const [quota, setQuota] = useState(null)

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const data = await getQuota()
      setQuota(data.nails)
    } catch (err) {
      setError('Error al cargar cuota')
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor ingresa una descripción')
      return
    }

    try {
      setLoading(true)
      setError('')
      setGeneratedImage(null)

      const result = await generateNailDesign(prompt)
      setGeneratedImage(result.generation)
      setQuota(result.quota)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar diseño')
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = async () => {
    try {
      setListening(true)
      setError('')
      const transcript = await requestSpeechRecognition()
      setPrompt(transcript)
    } catch (err) {
      setError('Error al reconocer voz: ' + err.message)
    } finally {
      setListening(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6 text-center">
          💅 Generador de Diseños de Uñas con IA
        </h1>

        {quota && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-xl p-4 mb-6 text-center">
            <p className="text-gray-700 dark:text-gray-300">
              Diseños restantes: <strong className="text-2xl text-[#FF1493]">{quota.remaining}</strong> / {quota.limit}
            </p>
            {!quota.hasQuota && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Has alcanzado tu límite mensual
              </p>
            )}
          </div>
        )}

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        <div className="space-y-6">
          <Textarea
            label="Describe tu diseño ideal"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ejemplo: Uñas francesas con detalles dorados y flores pequeñas"
            rows={5}
            maxLength={500}
            disabled={loading || listening}
            fullWidth
          />

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleVoiceInput}
              disabled={loading || listening}
              variant="outline"
              size="large"
            >
              {listening ? '🎤 Escuchando...' : '🎤 Usar Voz'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || (quota && !quota.hasQuota)}
              size="large"
            >
              {loading ? '⏳ Generando...' : '✨ Generar Diseño'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-16 h-16 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Creando tu diseño perfecto...
            </p>
          </div>
        )}

        {generatedImage && (
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              ✨ Tu diseño generado
            </h3>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FF1493]">
              <img
                src={generatedImage.output_image_url}
                alt="Diseño de uñas generado"
                className="w-full h-auto"
              />
            </div>
            <div className="flex justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold">⏱️ Tiempo:</span>
                <span>{generatedImage.generation_time_ms}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">🤖 Proveedor:</span>
                <span className="uppercase">{generatedImage.ai_provider}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default NailsGenerator
