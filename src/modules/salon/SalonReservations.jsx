import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getSalonReservations, confirmReservation, rejectReservation, completeReservation } from '../../services/reservation'
import { Button, Card, Alert } from '../../components/common'

const SalonReservations = () => {
  const { salonId } = useParams()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSalonReservations(salonId)
      setReservations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    if (salonId) {
      fetchReservations()
    }
  }, [salonId, fetchReservations])

  const handleConfirm = async (id) => {
    try {
      setProcessingId(id)
      await confirmReservation(id)
      await fetchReservations()
      setProcessingId(null)
    } catch (err) {
      setError(err.message)
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Motivo del rechazo (opcional):')
    if (reason === null) return

    try {
      setProcessingId(id)
      await rejectReservation(id, reason)
      await fetchReservations()
      setProcessingId(null)
    } catch (err) {
      setError(err.message)
      setProcessingId(null)
    }
  }

  const handleComplete = async (id, status) => {
    try {
      setProcessingId(id)
      await completeReservation(id, status)
      await fetchReservations()
      setProcessingId(null)
    } catch (err) {
      setError(err.message)
      setProcessingId(null)
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
    if (filter === 'pending') return res.status === 'pending'
    if (filter === 'upcoming') {
      return ['pending', 'confirmed'].includes(res.status) && new Date(res.start_time) > new Date()
    }
    if (filter === 'today') {
      const today = new Date()
      const resDate = new Date(res.start_time)
      return resDate.toDateString() === today.toDateString() && ['pending', 'confirmed'].includes(res.status)
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
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        Gestión de Reservas
      </h1>

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
            filter === 'today'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('today')}
        >
          Hoy
        </button>
        <button
          className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
            filter === 'pending'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('pending')}
        >
          Pendientes
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
            filter === 'confirmed'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmadas
        </button>
      </div>

      {filteredReservations.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No hay reservas {filter !== 'all' ? `en estado "${filter}"` : ''}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map((reservation) => {
            const badge = getStatusBadge(reservation.status)
            const isPending = reservation.status === 'pending'
            const isConfirmed = reservation.status === 'confirmed'
            const isProcessing = processingId === reservation.id
            
            return (
              <Card key={reservation.id} className="flex flex-col h-full" padding="medium">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {reservation.first_name} {reservation.last_name}
                    </h3>
                    {reservation.client_phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📞 {reservation.client_phone}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

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
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Hora:</span>
                    <p>
                      {new Date(reservation.start_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {reservation.notes && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Notas:</span>
                      <p className="text-xs italic">{reservation.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">Precio:</span>
                    <p className="text-lg font-bold text-[#FF1493]">{reservation.total_price}€</p>
                  </div>
                </div>

                {isPending && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button
                      variant="primary"
                      size="small"
                      fullWidth
                      onClick={() => handleConfirm(reservation.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '...' : '✓ Confirmar'}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      fullWidth
                      onClick={() => handleReject(reservation.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '...' : '✗ Rechazar'}
                    </Button>
                  </div>
                )}

                {isConfirmed && new Date(reservation.start_time) < new Date() && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Button
                      variant="primary"
                      size="small"
                      fullWidth
                      onClick={() => handleComplete(reservation.id, 'completed')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '...' : '✓ Marcar como Completada'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      fullWidth
                      onClick={() => handleComplete(reservation.id, 'no_show')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '...' : '✗ No se presentó'}
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

export default SalonReservations
