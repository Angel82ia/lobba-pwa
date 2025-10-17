import { useState, useEffect, useCallback } from 'react'
import { getNotificationHistory } from '../../services/notification'
import { Card, Button, Alert } from '../../components/common'

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
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100' },
      sending: { text: 'Enviando', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100' },
      sent: { text: 'Enviada', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100' },
      failed: { text: 'Fallida', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100' },
    }
    return badges[status] || badges.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        📜 Historial de Notificaciones
      </h1>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {notifications.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No hay notificaciones enviadas aún
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map(notification => {
              const badge = getStatusBadge(notification.status)
              return (
                <Card key={notification.id} padding="medium">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>
                  
                  {/* Body */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {notification.body}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>
                      <strong className="text-gray-900 dark:text-white">Tipo:</strong> {notification.type}
                    </span>
                    <span>
                      <strong className="text-gray-900 dark:text-white">Targeting:</strong>{' '}
                      {notification.targeting_type === 'geographic' ? 'Geográfico' : 'Mis clientes'}
                    </span>
                    {notification.radius_km && (
                      <span>
                        <strong className="text-gray-900 dark:text-white">Radio:</strong> {notification.radius_km} km
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <span className="text-gray-700 dark:text-gray-300">
                      Enviadas: <strong>{notification.sent_count || 0}</strong>
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      Exitosas: <strong>{notification.success_count || 0}</strong>
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      Fallidas: <strong>{notification.failure_count || 0}</strong>
                    </span>
                  </div>
                  
                  {/* Date */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(notification.created_at)}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
            >
              ← Anterior
            </Button>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Página {page}
            </span>
            <Button
              onClick={() => setPage(p => p + 1)}
              disabled={notifications.length < 20}
              variant="outline"
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationHistory
