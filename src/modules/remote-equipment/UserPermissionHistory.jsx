import { useState, useEffect, useCallback } from 'react'
import { getUserPermissions } from '../../services/permission'
import { getUserEvents } from '../../services/deviceEvent'
import Card from '../../components/common/Card'
import './UserPermissionHistory.css'

const UserPermissionHistory = () => {
  const [permissions, setPermissions] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const statusFilter = filter === 'all' ? null : filter
      const [permsData, eventsData] = await Promise.all([
        getUserPermissions(statusFilter),
        getUserEvents(1, 50)
      ])
      
      setPermissions(permsData)
      setEvents(eventsData)
    } catch (err) {
      setError('Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending'
      case 'used':
        return 'status-used'
      case 'expired':
        return 'status-expired'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'dispense_success': 'Entrega Exitosa',
      'dispense_error': 'Error en Entrega',
      'pickup_success': 'Recogida Exitosa',
      'pickup_error': 'Error en Recogida',
      'return_success': 'Devolución Exitosa',
      'return_error': 'Error en Devolución'
    }
    return labels[eventType] || eventType
  }

  return (
    <div className="user-permission-history">
      <Card>
        <h2>Mi Historial de Permisos</h2>
        
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button
            className={filter === 'used' ? 'active' : ''}
            onClick={() => setFilter('used')}
          >
            Usados
          </button>
          <button
            className={filter === 'expired' ? 'active' : ''}
            onClick={() => setFilter('expired')}
          >
            Expirados
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading">Cargando historial...</div>}

        {!loading && permissions.length === 0 && (
          <div className="empty-state">
            <p>No tienes permisos {filter !== 'all' ? `con estado "${filter}"` : 'registrados'}</p>
          </div>
        )}

        {!loading && permissions.length > 0 && (
          <div className="permissions-list">
            {permissions.map(permission => {
              const relatedEvents = events.filter(e => e.permission_id === permission.id)
              
              return (
                <div key={permission.id} className="permission-item">
                  <div className="permission-header">
                    <div>
                      <h3>{permission.permission_type === 'item' ? 'Artículo Gratis' : 'Equipo en Préstamo'}</h3>
                      <p className="permission-type">{permission.action_type}</p>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(permission.status)}`}>
                      {permission.status}
                    </span>
                  </div>
                  
                  <div className="permission-details">
                    <div className="detail-item">
                      <span className="label">ID Dispositivo:</span>
                      <span>{permission.device_id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Creado:</span>
                      <span>{new Date(permission.created_at).toLocaleString('es-ES')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expira:</span>
                      <span>{new Date(permission.expires_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>

                  {relatedEvents.length > 0 && (
                    <div className="related-events">
                      <h4>Eventos Relacionados</h4>
                      {relatedEvents.map(event => (
                        <div key={event.id} className="event-item">
                          <span className="event-type">
                            {getEventTypeLabel(event.event_type)}
                          </span>
                          <span className="event-time">
                            {new Date(event.created_at).toLocaleString('es-ES')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export default UserPermissionHistory
