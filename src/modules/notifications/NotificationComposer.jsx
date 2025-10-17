import { useState } from 'react'
import { sendNotification } from '../../services/notification'
import { Card, Button, Input, Textarea, Select, Alert } from '../../components/common'

const NotificationComposer = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'oferta',
    targetingType: 'geographic',
    radiusKm: 10,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRadiusChange = (e) => {
    setFormData(prev => ({ ...prev, radiusKm: parseInt(e.target.value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.body) {
      setError('Por favor completa todos los campos')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const result = await sendNotification(formData)
      
      setSuccess(`Notificación enviada correctamente. Enviada a ${result.success_count || 0} usuarios.`)
      setFormData({
        title: '',
        body: '',
        type: 'oferta',
        targetingType: 'geographic',
        radiusKm: 10,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar notificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6">
          Enviar Notificación
        </h1>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ej: ¡Oferta especial!"
            maxLength={100}
            required
            fullWidth
          />

          <Textarea
            label="Mensaje"
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder="Escribe el contenido de la notificación..."
            rows={5}
            maxLength={500}
            required
            fullWidth
          />

          <Select
            label="Tipo de Notificación"
            name="type"
            value={formData.type}
            onChange={handleChange}
            fullWidth
          >
            <option value="oferta">Oferta</option>
            <option value="evento">Evento</option>
            <option value="recordatorio">Recordatorio</option>
            <option value="info">Información</option>
          </Select>

          <Select
            label="Tipo de Segmentación"
            name="targetingType"
            value={formData.targetingType}
            onChange={handleChange}
            fullWidth
          >
            <option value="all">Todos los usuarios</option>
            <option value="active_members">Solo Socias Activas</option>
            <option value="geographic">Geográfica (basada en ubicación)</option>
          </Select>

          {formData.targetingType === 'geographic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Radio (kilómetros): {formData.radiusKm} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={formData.radiusKm}
                onChange={handleRadiusChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF1493]"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                La notificación se enviará a usuarios dentro de {formData.radiusKm} km del salón.
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Vista Previa
            </h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-base font-bold text-gray-900 dark:text-white mb-2">
                {formData.title || 'Título de la notificación'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {formData.body || 'Contenido de la notificación aparecerá aquí...'}
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            loading={loading} 
            fullWidth 
            size="large"
            className="mt-8"
          >
            {loading ? 'Enviando...' : 'Enviar Notificación'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default NotificationComposer
