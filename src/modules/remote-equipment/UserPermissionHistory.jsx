import { useState, useEffect, useCallback } from 'react'
import { getUserPermissions } from '../../services/permission'
import { getUserEvents } from '../../services/deviceEvent'
import { Card, Alert } from '../../components/common'

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100' },
      used: { text: 'Usado', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100' },
      expired: { text: 'Expirado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100' },
    }
    return badges[status] || badges.pending
  }

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'dispense_success': '✅ Entrega Exitosa',
      'dispense_error': '❌ Error en Entrega',
      'pickup_success': '✅ Recogida Exitosa',
      'pickup_error': '❌ Error en Recogida',
      'return_success': '✅ Devolución Exitosa',
      'return_error': '❌ Error en Devolución'
    }
    return labels[eventType] || eventType
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        📜 Mi Historial de Permisos
      </h2>
      
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['all', 'pending', 'used', 'expired'].map(status => (
          <button
            key={status}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
              filter === status
                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1) + 's'}
          </button>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      )}

      {!loading && permissions.length === 0 && (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No tienes permisos {filter !== 'all' ? `con estado "${filter}"` : 'registrados'}
          </p>
        </Card>
      )}

      {!loading && permissions.length > 0 && (
        <div className="space-y-4">
          {permissions.map(permission => {
            const relatedEvents = events.filter(e => e.permission_id === permission.id)
            const badge = getStatusBadge(permission.status)
            
            return (
              <Card key={permission.id} padding="medium">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {permission.permission_type === 'item' ? '🎁 Artículo Gratis' : '🔋 Equipo en Préstamo'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {permission.action_type}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
                
                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      ID Dispositivo
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {permission.device_id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Creado
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(permission.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Expira
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(permission.expires_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Related Events */}
                {relatedEvents.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                      Eventos Relacionados
                    </h4>
                    <div className="space-y-2">
                      {relatedEvents.map(event => (
                        <div 
                          key={event.id} 
                          className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {getEventTypeLabel(event.event_type)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(event.created_at).toLocaleString('es-ES')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserPermissionHistory
