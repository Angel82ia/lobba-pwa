import { useEffect, useState } from 'react'
import { Button, Card, Input, Alert } from '../../components/common'
import useStore from '../../store'
import apiClient from '../../services/api'

const DeviceRegistration = () => {
  const { auth } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [location, setLocation] = useState(null)
  const [formData, setFormData] = useState({
    deviceId: '',
    capabilities: [],
  })

  const availableCapabilities = [
    { id: 'dispense', label: 'Dispensar' },
    { id: 'pickup', label: 'Recogida' },
    { id: 'return', label: 'Devolución' },
    { id: 'telemetry', label: 'Telemetría' },
    { id: 'stock_tracking', label: 'Control de Stock' },
  ]

  useEffect(() => {
    if (auth.user?.role !== 'device') {
      setUnauthorized(true)
      return
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
        }
      )
    }
  }, [auth.user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCapabilityToggle = (capabilityId) => {
    setFormData((prev) => {
      const capabilities = prev.capabilities.includes(capabilityId)
        ? prev.capabilities.filter((c) => c !== capabilityId)
        : [...prev.capabilities, capabilityId]
      return { ...prev, capabilities }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await apiClient.post('/device', {
        deviceId: formData.deviceId,
        capabilities: formData.capabilities,
        location,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (unauthorized) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">
          No autorizado. Solo equipos pueden registrarse.
        </Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card padding="large">
          <h1 className="font-primary text-2xl font-bold text-[#FF1493] mb-4">
            Equipo Registrado Exitosamente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            El equipo {formData.deviceId} ha sido registrado correctamente.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-2xl font-bold text-[#FF1493] mb-6">
          Registro de Equipo
        </h1>
        
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Identificador del Equipo"
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Capacidades del Equipo
            </label>
            <div className="space-y-3">
              {availableCapabilities.map((capability) => (
                <label 
                  key={capability.id} 
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(capability.id)}
                    onChange={() => handleCapabilityToggle(capability.id)}
                    className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer"
                  />
                  <span className="text-gray-900 dark:text-white">
                    {capability.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {location && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-white">
                <strong className="font-semibold">Ubicación:</strong> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          )}
          
          <div className="mt-8">
            <Button type="submit" disabled={loading} fullWidth size="large">
              {loading ? 'Registrando...' : 'Registrar Equipo'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default DeviceRegistration
