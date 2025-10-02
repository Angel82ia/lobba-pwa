import { useEffect, useState } from 'react'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import useStore from '../../store'
import apiClient from '../../services/api'
import './DeviceRegistration.css'

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
    return <div className="error">No autorizado. Solo equipos pueden registrarse.</div>
  }

  if (success) {
    return (
      <div className="device-registration">
        <Card>
          <h1>Equipo Registrado Exitosamente</h1>
          <p>El equipo {formData.deviceId} ha sido registrado correctamente.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="device-registration">
      <Card>
        <h1>Registro de Equipo</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Identificador del Equipo"
            name="deviceId"
            value={formData.deviceId}
            onChange={handleChange}
            required
          />
          
          <div className="form-group">
            <label>Capacidades del Equipo</label>
            <div className="capabilities-list">
              {availableCapabilities.map((capability) => (
                <label key={capability.id} className="capability-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(capability.id)}
                    onChange={() => handleCapabilityToggle(capability.id)}
                  />
                  <span>{capability.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {location && (
            <div className="location-info">
              <p>
                <strong>Ubicación:</strong> {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          )}
          
          <div className="form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Equipo'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default DeviceRegistration
