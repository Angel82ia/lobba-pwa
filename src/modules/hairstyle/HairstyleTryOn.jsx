import { useState, useEffect, useRef } from 'react'
import { generateHairstyle, getQuota, getCatalog } from '../../services/ai'
import { Card, Button, Alert } from '../../components/common'

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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6 text-center">
          💇 Prueba Virtual de Peinados con IA
        </h1>

        {quota && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-xl p-4 mb-6 text-center">
            <p className="text-gray-700 dark:text-gray-300">
              Pruebas restantes: <strong className="text-2xl text-[#FF1493]">{quota.remaining}</strong> / {quota.limit}
            </p>
            {!quota.hasQuota && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Has alcanzado tu límite mensual
              </p>
            )}
          </div>
        )}

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Upload Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            1️⃣ Sube tu selfie
          </h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="large"
          >
            📸 Seleccionar Foto
          </Button>
          {selfiePreview && (
            <div className="mt-4 max-w-sm mx-auto">
              <img 
                src={selfiePreview} 
                alt="Tu selfie"
                className="w-full rounded-xl shadow-lg border-2 border-[#FF1493]"
              />
            </div>
          )}
        </div>

        {/* Styles Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            2️⃣ Elige un estilo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {catalog.map((style) => (
              <div
                key={style.style_id}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  selectedStyle === style.style_id
                    ? 'border-[#FF1493] shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#FF1493] hover:shadow-md'
                }`}
                onClick={() => setSelectedStyle(style.style_id)}
              >
                <img 
                  src={style.preview_image_url} 
                  alt={style.name}
                  className="w-full aspect-square object-cover"
                />
                <p className="text-center text-sm font-medium text-gray-900 dark:text-white py-2">
                  {style.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleGenerate}
            disabled={loading || (quota && !quota.hasQuota) || !selfieFile || !selectedStyle}
            size="large"
          >
            {loading ? '⏳ Generando tu nuevo look...' : '✨ Probar Peinado'}
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Creando tu nuevo look mágico...
            </p>
          </div>
        )}

        {/* Generated Result */}
        {generatedImage && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              ✨ Tu nuevo look
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <p className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Antes
                </p>
                <img 
                  src={generatedImage.input_image_url} 
                  alt="Antes"
                  className="w-full rounded-xl shadow-xl"
                />
              </div>
              <div>
                <p className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Después
                </p>
                <img 
                  src={generatedImage.output_image_url} 
                  alt="Después"
                  className="w-full rounded-xl shadow-xl border-4 border-[#FF1493]"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default HairstyleTryOn
