import { useState, useEffect, useCallback } from 'react'
import { getAllNotifications } from '../../services/notification'
import Card from '../../components/common/Card'
import './NotificationDashboard.css'

const NotificationDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAllNotifications(page, 50)
      setNotifications(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', class: 'status-pending' },
      sending: { text: 'Enviando', class: 'status-sending' },
      sent: { text: 'Enviada', class: 'status-sent' },
      failed: { text: 'Fallida', class: 'status-failed' },
    }
    return badges[status] || badges.pending
  }

  if (loading) return <div className="loading">Cargando dashboard...</div>

  return (
    <div className="notification-dashboard-page">
      <h1>Dashboard de Notificaciones</h1>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <Card>
          <p className="empty-message">No hay notificaciones registradas</p>
        </Card>
      ) : (
        <div className="dashboard-table">
          <table>
            <thead>
              <tr>
                <th>Salón</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Targeting</th>
                <th>Enviadas</th>
                <th>Exitosas</th>
                <th>Fallidas</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(notification => {
                const badge = getStatusBadge(notification.status)
                return (
                  <tr key={notification.id}>
                    <td className="salon-name">{notification.salon_name || 'N/A'}</td>
                    <td className="notification-title">{notification.title}</td>
                    <td>
                      <span className="type-badge">{notification.type}</span>
                    </td>
                    <td>
                      {notification.targeting_type === 'geographic' 
                        ? `Geográfico (${notification.radius_km}km)` 
                        : 'Clientes propios'}
                    </td>
                    <td className="text-center">{notification.sent_count || 0}</td>
                    <td className="text-center success-count">{notification.success_count || 0}</td>
                    <td className="text-center failed-count">{notification.failure_count || 0}</td>
                    <td>
                      <span className={`status-badge ${badge.class}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(notification.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={notifications.length < 50}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationDashboard
