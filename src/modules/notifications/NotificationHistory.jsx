import { useState, useEffect, useCallback } from 'react'
import { getNotificationHistory } from '../../services/notification'
import Card from '../../components/common/Card'
import './NotificationHistory.css'

const NotificationHistory = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getNotificationHistory(page, 20)
      setNotifications(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
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

  if (loading) return <div className="loading">Cargando historial...</div>

  return (
    <div className="notification-history-page">
      <h1>Historial de Notificaciones</h1>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <Card>
          <p className="empty-message">No hay notificaciones enviadas aún</p>
        </Card>
      ) : (
        <div className="history-list">
          {notifications.map(notification => {
            const badge = getStatusBadge(notification.status)
            return (
              <Card key={notification.id} className="history-item">
                <div className="history-header">
                  <h3>{notification.title}</h3>
                  <span className={`status-badge ${badge.class}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="history-body">{notification.body}</p>
                <div className="history-meta">
                  <span className="meta-item">
                    <strong>Tipo:</strong> {notification.type}
                  </span>
                  <span className="meta-item">
                    <strong>Targeting:</strong> {notification.targeting_type === 'geographic' ? 'Geográfico' : 'Mis clientes'}
                  </span>
                  {notification.radius_km && (
                    <span className="meta-item">
                      <strong>Radio:</strong> {notification.radius_km} km
                    </span>
                  )}
                </div>
                <div className="history-stats">
                  <span className="stat-item">
                    Enviadas: <strong>{notification.sent_count || 0}</strong>
                  </span>
                  <span className="stat-item success">
                    Exitosas: <strong>{notification.success_count || 0}</strong>
                  </span>
                  <span className="stat-item failed">
                    Fallidas: <strong>{notification.failure_count || 0}</strong>
                  </span>
                </div>
                <div className="history-date">
                  {formatDate(notification.created_at)}
                </div>
              </Card>
            )
          })}
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
            disabled={notifications.length < 20}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationHistory
