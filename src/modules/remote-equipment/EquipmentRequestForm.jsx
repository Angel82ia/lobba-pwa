import { useState, useEffect } from 'react'
import { getAvailableEquipment } from '../../services/equipment'
import { requestEquipmentPickup, requestEquipmentReturn } from '../../services/permission'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './EquipmentRequestForm.css'

const EquipmentRequestForm = () => {
  const [equipment, setEquipment] = useState([])
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [deviceId, setDeviceId] = useState('')
  const [requestType, setRequestType] = useState('pickup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAvailableEquipment()
      setEquipment(data)
    } catch (err) {
      setError('Error al cargar equipos disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEquipment || !deviceId.trim()) {
      setError('Debes seleccionar un equipo y un dispositivo')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const data = requestType === 'pickup'
        ? await requestEquipmentPickup(deviceId, selectedEquipment.id)
        : await requestEquipmentReturn(deviceId, selectedEquipment.id)
      
      setSuccess(data)
      setSelectedEquipment(null)
      setDeviceId('')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar permiso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="equipment-request-form">
      <Card>
        <h2>Solicitar Equipo en Préstamo</h2>
        <p className="description">
          Selecciona un equipo y el dispositivo donde lo quieres recoger o devolver
        </p>

        <div className="request-type-selector">
          <button
            className={requestType === 'pickup' ? 'active' : ''}
            onClick={() => setRequestType('pickup')}
          >
            Recoger Equipo
          </button>
          <button
            className={requestType === 'return' ? 'active' : ''}
            onClick={() => setRequestType('return')}
          >
            Devolver Equipo
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {equipment.length === 0 && !loading && (
          <div className="empty-state">
            <p>No hay equipos disponibles en este momento</p>
            <Button onClick={fetchEquipment}>Recargar</Button>
          </div>
        )}

        {equipment.length > 0 && (
          <div className="equipment-grid">
            {equipment.map(item => (
              <div
                key={item.id}
                className={`equipment-card ${selectedEquipment?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedEquipment(item)}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} />
                )}
                <h3>{item.name}</h3>
                <p className="category">{item.category}</p>
                <span className={`status-badge ${item.status}`}>
                  {item.status === 'available' ? 'Disponible' : item.status}
                </span>
                {item.description && (
                  <p className="description">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedEquipment && (
          <form onSubmit={handleSubmit} className="request-form">
            <h3>Equipo seleccionado: {selectedEquipment.name}</h3>
            
            <div className="form-group">
              <label htmlFor="deviceId">ID del Dispositivo</label>
              <input
                type="text"
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Escanea o ingresa el ID del dispositivo"
                required
              />
            </div>

            <div className="form-actions">
              <Button type="button" onClick={() => setSelectedEquipment(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Solicitando...' : `Solicitar ${requestType === 'pickup' ? 'Recogida' : 'Devolución'}`}
              </Button>
            </div>
          </form>
        )}

        {success && (
          <div className="success-message">
            <h3>¡Permiso creado exitosamente!</h3>
            <p>Muestra este código QR en el dispositivo:</p>
            <div className="qr-code">
              <p className="token">{success.token}</p>
            </div>
            <Button onClick={() => setSuccess(null)}>Solicitar Otro</Button>
          </div>
        )}

        {loading && <div className="loading">Cargando...</div>}
      </Card>
    </div>
  )
}

export default EquipmentRequestForm
