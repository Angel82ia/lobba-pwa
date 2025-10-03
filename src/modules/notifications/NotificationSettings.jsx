import { useState, useEffect } from 'react'
import { getNotificationPreferences, updateNotificationPreferences, requestNotificationPermission } from '../../services/notification'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './NotificationSettings.css'

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preferences, setPreferences] = useState({
    notifications_enabled: true,
    types_enabled: ['oferta', 'evento', 'descuento', 'noticia'],
    max_radius_km: 50,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getNotificationPreferences()
      setPreferences(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar preferencias')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleNotifications = async () => {
    if (!preferences.notifications_enabled) {
      const permission = await requestNotificationPermission()
      if (!permission.granted) {
        setError('Permisos de notificación denegados')
        return
      }
    }

    const updated = {
      ...preferences,
      notifications_enabled: !preferences.notifications_enabled,
    }
    setPreferences(updated)
    await savePreferences(updated)
  }

  const handleToggleType = (type) => {
    const types = preferences.types_enabled.includes(type)
      ? preferences.types_enabled.filter(t => t !== type)
      : [...preferences.types_enabled, type]
    
    const updated = { ...preferences, types_enabled: types }
    setPreferences(updated)
  }

  const handleRadiusChange = (e) => {
    const updated = { ...preferences, max_radius_km: parseInt(e.target.value) }
    setPreferences(updated)
  }

  const savePreferences = async (data = preferences) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await updateNotificationPreferences(data)
      setSuccess('Preferencias guardadas correctamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar preferencias')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Cargando preferencias...</div>

  return (
    <div className="notification-settings-page">
      <Card>
        <h1>Configuración de Notificaciones</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="settings-section">
          <div className="setting-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={preferences.notifications_enabled}
                onChange={handleToggleNotifications}
              />
              <span>Activar notificaciones push</span>
            </label>
          </div>

          {preferences.notifications_enabled && (
            <>
              <div className="setting-item">
                <h3>Tipos de notificaciones</h3>
                {['oferta', 'evento', 'descuento', 'noticia'].map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.types_enabled.includes(type)}
                      onChange={() => handleToggleType(type)}
                    />
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                  </label>
                ))}
              </div>

              <div className="setting-item">
                <h3>Radio geográfico máximo</h3>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={preferences.max_radius_km}
                  onChange={handleRadiusChange}
                />
                <span className="radius-value">{preferences.max_radius_km} km</span>
              </div>

              <Button onClick={() => savePreferences()} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default NotificationSettings
