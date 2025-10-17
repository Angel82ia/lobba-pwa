import { useState, useEffect, useCallback } from 'react'
import { getAllNotifications } from '../../services/notification'
import { Card, Button, Alert } from '../../components/common'

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
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100' },
      sending: { text: 'Enviando', color: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100' },
      sent: { text: 'Enviada', color: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100' },
      failed: { text: 'Fallida', color: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100' },
    }
    return badges[status] || badges.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        Dashboard de Notificaciones
      </h1>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {notifications.length === 0 ? (
        <Card className="text-center" padding="large">
          <p className="text-gray-600 dark:text-gray-400">
            No hay notificaciones registradas
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Salón
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Targeting
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Enviadas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Exitosas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Fallidas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map(notification => {
                  const badge = getStatusBadge(notification.status)
                  return (
                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        {notification.salon_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {notification.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-[#FFE6F5] text-[#C71585]">
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {notification.targeting_type === 'geographic' 
                          ? `Geográfico (${notification.radius_km}km)` 
                          : 'Clientes propios'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                        {notification.sent_count || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-green-600 dark:text-green-400 font-semibold">
                        {notification.success_count || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-600 dark:text-red-400 font-semibold">
                        {notification.failure_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(notification.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Button
              variant="outline"
              size="small"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page}
            </span>
            <Button
              variant="outline"
              size="small"
              onClick={() => setPage(p => p + 1)}
              disabled={notifications.length < 50}
            >
              Siguiente
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default NotificationDashboard
