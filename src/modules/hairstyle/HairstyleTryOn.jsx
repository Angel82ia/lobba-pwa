import { useState, useEffect, useRef } from 'react'
import { generateHairstyle, getQuota, getCatalog } from '../../services/ai'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './HairstyleTryOn.css'

const HairstyleTryOn = () => {
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [selfieFile, setSelfieFile] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)
  const [quota, setQuota] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchQuota()
    fetchCatalog()
  }, [])

  const fetchQuota = async () => {
    try {
      const data = await getQuota()
      setQuota(data.hairstyle)
    } catch (err) {
      setError('Error al cargar cuota')
    }
  }

  const fetchCatalog = async () => {
    try {
      const items = await getCatalog('hairstyle', null, 1, 20)
      setCatalog(items)
    } catch (err) {
      setError('Error al cargar catálogo')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    setSelfieFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelfiePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selfieFile) {
      setError('Por favor sube una selfie')
      return
    }

    if (!selectedStyle) {
      setError('Por favor selecciona un estilo')
      return
    }

    try {
      setLoading(true)
      setError('')
      setGeneratedImage(null)

      const result = await generateHairstyle(selfiePreview, selectedStyle)
      setGeneratedImage(result.generation)
      setQuota(result.quota)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar peinado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hairstyle-tryon-page">
      <Card>
        <h1>Prueba Virtual de Peinados</h1>

        {quota && (
          <div className="quota-info">
            <p>
              Pruebas restantes: <strong>{quota.remaining}</strong> / {quota.limit}
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="upload-section">
          <h3>1. Sube tu selfie</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            📸 Seleccionar Foto
          </Button>
          {selfiePreview && (
            <div className="selfie-preview">
              <img src={selfiePreview} alt="Tu selfie" />
            </div>
          )}
        </div>

        <div className="styles-section">
          <h3>2. Elige un estilo</h3>
          <div className="styles-grid">
            {catalog.map((style) => (
              <div
                key={style.style_id}
                className={`style-card ${selectedStyle === style.style_id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style.style_id)}
              >
                <img src={style.preview_image_url} alt={style.name} />
                <p>{style.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="generate-section">
          <Button
            onClick={handleGenerate}
            disabled={loading || (quota && !quota.hasQuota)}
          >
            {loading ? 'Generando...' : '✨ Probar Peinado'}
          </Button>
        </div>

        {generatedImage && (
          <div className="generated-result">
            <h3>Tu nuevo look</h3>
            <div className="comparison">
              <div className="comparison-image">
                <p>Antes</p>
                <img src={generatedImage.input_image_url} alt="Antes" />
              </div>
              <div className="comparison-image">
                <p>Después</p>
                <img src={generatedImage.output_image_url} alt="Después" />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default HairstyleTryOn
