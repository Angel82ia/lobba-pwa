import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserReservations, cancelReservation } from '../../services/reservation'
import { Button, Card, Alert } from '../../components/common'

const ReservationList = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const data = await getUserReservations()
      setReservations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return

    try {
      await cancelReservation(id, 'Cancelado por el usuario')
      fetchReservations()
    } catch (err) {
      alert('Error al cancelar la reserva: ' + err.message)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100' },
      confirmed: { text: 'Confirmada', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100' },
      completed: { text: 'Completada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100' },
      cancelled: { text: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100' },
      no_show: { text: 'No asistió', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    }
    return badges[status] || badges.pending
  }

  const filteredReservations = reservations.filter((res) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') {
      return ['pending', 'confirmed'].includes(res.status) && new Date(res.start_time) > new Date()
    }
    if (filter === 'past') {
      return ['completed', 'cancelled', 'no_show'].includes(res.status) || new Date(res.start_time) < new Date()
    }
    return res.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando reservas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493]">Mis Reservas</h1>
        <Link to="/salones">
          <Button>+ Nueva Reserva</Button>
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
            filter === 'all'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button
          className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
            filter === 'upcoming'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('upcoming')}
        >
          Próximas
        </button>
        <button
          className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
            filter === 'past'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('past')}
        >
          Pasadas
        </button>
      </div>

      {/* Reservations */}
      {filteredReservations.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No tienes reservas {filter !== 'all' ? (filter === 'upcoming' ? 'próximas' : 'pasadas') : ''}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map((reservation) => {
            const badge = getStatusBadge(reservation.status)
            return (
              <Card key={reservation.id} className="flex flex-col h-full" padding="medium">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {reservation.business_name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 flex-1 text-gray-700 dark:text-gray-300 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Servicio:</span>
                    <p>{reservation.service_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Fecha:</span>
                    <p>
                      {new Date(reservation.start_time).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'Europe/Madrid',
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Hora:</span>
                    <p>
                      {new Date(reservation.start_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Madrid',
                      })}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">Precio:</span>
                    <p className="text-lg font-bold text-[#FF1493]">{reservation.total_price}€</p>
                  </div>
                </div>

                {/* Actions */}
                {['pending', 'confirmed'].includes(reservation.status) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="danger" 
                      size="small" 
                      fullWidth
                      onClick={() => handleCancel(reservation.id)}
                    >
                      Cancelar Reserva
                    </Button>
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

export default ReservationList
