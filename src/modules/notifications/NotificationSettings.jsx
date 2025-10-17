import { useState, useEffect } from 'react'
import { getNotificationPreferences, updateNotificationPreferences, requestNotificationPermission } from '../../services/notification'
import { Card, Button, Alert } from '../../components/common'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando preferencias...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6">
          Configuración de Notificaciones
        </h1>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <div className="space-y-8">
          {/* Toggle principal */}
          <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications_enabled}
                onChange={handleToggleNotifications}
                className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer"
              />
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                Activar notificaciones push
              </span>
            </label>
          </div>

          {preferences.notifications_enabled && (
            <>
              {/* Tipos de notificaciones */}
              <div>
                <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Tipos de notificaciones
                </h3>
                <div className="space-y-3">
                  {['oferta', 'evento', 'descuento', 'noticia'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={preferences.types_enabled.includes(type)}
                        onChange={() => handleToggleType(type)}
                        className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Radio geográfico */}
              <div>
                <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Radio geográfico máximo
                </h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={preferences.max_radius_km}
                    onChange={handleRadiusChange}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF1493]"
                  />
                  <p className="text-center text-2xl font-bold text-[#FF1493]">
                    {preferences.max_radius_km} km
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Recibirás notificaciones de salones dentro de este radio
                  </p>
                </div>
              </div>

              {/* Botón guardar */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={() => savePreferences()} 
                  disabled={saving}
                  fullWidth
                  size="large"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default NotificationSettings
