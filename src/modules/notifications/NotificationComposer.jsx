import { useState } from 'react'
import { sendNotification } from '../../services/notification'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import './NotificationComposer.css'

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
    <div className="notification-composer-page">
      <Card>
        <h1>Enviar Notificación</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="composer-form">
          <div className="form-group">
            <label htmlFor="title">Título</label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: ¡Oferta especial!"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Mensaje</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Describe tu oferta o evento..."
              rows={4}
              maxLength={500}
              className="textarea-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="select-input"
            >
              <option value="oferta">Oferta</option>
              <option value="evento">Evento</option>
              <option value="descuento">Descuento</option>
              <option value="noticia">Noticia</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetingType">Destinatarios</label>
            <select
              id="targetingType"
              name="targetingType"
              value={formData.targetingType}
              onChange={handleChange}
              className="select-input"
            >
              <option value="geographic">Por ubicación geográfica</option>
              <option value="own_clients">Mis clientes</option>
            </select>
          </div>

          {formData.targetingType === 'geographic' && (
            <div className="form-group">
              <label htmlFor="radiusKm">Radio de alcance</label>
              <input
                type="range"
                id="radiusKm"
                name="radiusKm"
                min="1"
                max="50"
                value={formData.radiusKm}
                onChange={handleRadiusChange}
                className="range-input"
              />
              <span className="radius-value">{formData.radiusKm} km</span>
            </div>
          )}

          <div className="preview-section">
            <h3>Vista previa</h3>
            <div className="notification-preview">
              <div className="preview-title">{formData.title || 'Título de la notificación'}</div>
              <div className="preview-body">{formData.body || 'Contenido del mensaje...'}</div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Notificación'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default NotificationComposer
