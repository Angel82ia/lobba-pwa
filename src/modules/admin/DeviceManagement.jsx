import { useState, useEffect } from 'react'
import { getAllEquipment, updateEquipmentStatus } from '../../services/equipment'
import { getDeviceStats, getRecentErrors } from '../../services/deviceEvent'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import useStore from '../../store'

const DeviceManagement = () => {
  const { auth } = useStore()
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [stats, setStats] = useState(null)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (auth.user?.role !== 'admin') {
      setUnauthorized(true)
      setLoading(false)
      return
    }
    fetchDevices()
  }, [auth.user])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAllEquipment(1, 100)
      setDevices(data)
    } catch (err) {
      setError('Error al cargar dispositivos')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceStats = async (deviceId) => {
    try {
      const [statsData, errorsData] = await Promise.all([
        getDeviceStats(deviceId, 7),
        getRecentErrors(24, 20)
      ])
      setStats(statsData)
      setErrors(errorsData.filter(e => e.device_id === deviceId))
    } catch (err) {
      setError('Error al cargar estadísticas del dispositivo')
    }
  }

  const handleSelectDevice = (device) => {
    setSelectedDevice(device)
    fetchDeviceStats(device.id)
  }

  const handleUpdateStatus = async (deviceId, newStatus) => {
    try {
      await updateEquipmentStatus(deviceId, newStatus)
      await fetchDevices()
      setError('')
    } catch (err) {
      setError('Error al actualizar estado del dispositivo')
    }
  }

  if (unauthorized) {
    return <div className="error">No autorizado. Solo administradores pueden acceder.</div>
  }

  if (loading) {
    return <div className="loading">Cargando dispositivos...</div>
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'status-available'
      case 'on_loan':
        return 'status-on-loan'
      case 'maintenance':
        return 'status-maintenance'
      default:
        return ''
    }
  }

  return (
    <div className="device-management">
      <h1>Gestión de Dispositivos Remotos</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="management-layout">
        <Card className="devices-list">
          <h2>Dispositivos Registrados</h2>
          <div className="devices-grid">
            {devices.map(device => (
              <div
                key={device.id}
                className={`device-card ${selectedDevice?.id === device.id ? 'selected' : ''}`}
                onClick={() => handleSelectDevice(device)}
              >
                <h3>{device.name}</h3>
                <p className="device-category">{device.category}</p>
                <span className={`status-badge ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
                {device.current_location_id && (
                  <p className="device-location">📍 {device.current_location_id}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {selectedDevice && (
          <Card className="device-details">
            <h2>Detalles: {selectedDevice.name}</h2>
            
            <div className="detail-section">
              <h3>Información</h3>
              <p><strong>ID:</strong> {selectedDevice.id}</p>
              <p><strong>Categoría:</strong> {selectedDevice.category}</p>
              <p><strong>Estado:</strong> {selectedDevice.status}</p>
              <p><strong>Requiere Devolución:</strong> {selectedDevice.requires_return ? 'Sí' : 'No'}</p>
            </div>

            <div className="detail-section">
              <h3>Acciones</h3>
              <div className="action-buttons">
                <Button onClick={() => handleUpdateStatus(selectedDevice.id, 'available')}>
                  Marcar Disponible
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedDevice.id, 'maintenance')}>
                  Marcar Mantenimiento
                </Button>
              </div>
            </div>

            {stats && (
              <div className="detail-section">
                <h3>Estadísticas (últimos 7 días)</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Eventos</span>
                    <span className="stat-value">{stats.total_events || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tasa de Éxito</span>
                    <span className="stat-value">
                      {stats.success_rate ? `${(stats.success_rate * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Errores</span>
                    <span className="stat-value">{stats.error_count || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="detail-section">
                <h3>Errores Recientes</h3>
                <div className="errors-list">
                  {errors.map(err => (
                    <div key={err.id} className="error-item">
                      <span className="error-type">{err.event_type}</span>
                      <span className="error-time">
                        {new Date(err.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

export default DeviceManagement
