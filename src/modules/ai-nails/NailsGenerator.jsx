import { useState, useEffect } from 'react'
import { generateNailDesign, getQuota, requestSpeechRecognition } from '../../services/ai'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './NailsGenerator.css'

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
    <div className="nails-generator-page">
      <Card>
        <h1>Generador de Diseños de Uñas</h1>

        {quota && (
          <div className="quota-info">
            <p>
              Diseños restantes: <strong>{quota.remaining}</strong> / {quota.limit}
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="input-section">
          <label htmlFor="prompt">Describe tu diseño ideal</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ejemplo: Uñas francesas con detalles dorados y flores pequeñas"
            rows="4"
            disabled={loading || listening}
          />

          <div className="action-buttons">
            <Button
              onClick={handleVoiceInput}
              disabled={loading || listening}
              variant="secondary"
            >
              {listening ? '🎤 Escuchando...' : '🎤 Usar Voz'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || (quota && !quota.hasQuota)}
            >
              {loading ? 'Generando...' : '✨ Generar Diseño'}
            </Button>
          </div>
        </div>

        {generatedImage && (
          <div className="generated-result">
            <h3>Tu diseño generado</h3>
            <img
              src={generatedImage.output_image_url}
              alt="Diseño de uñas generado"
              className="generated-image"
            />
            <div className="generation-info">
              <p>Tiempo: {generatedImage.generation_time_ms}ms</p>
              <p>Proveedor: {generatedImage.ai_provider}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default NailsGenerator
