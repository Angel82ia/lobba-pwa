import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserReservations, cancelReservation } from '../../services/reservation'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import './ReservationList.css'

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

  if (loading) return <div className="loading">Cargando reservas...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="reservation-list">
      <div className="list-header">
        <h1>Mis Reservas</h1>
        <Link to="/salons">
          <Button>Nueva Reserva</Button>
        </Link>
      </div>

      <div className="filter-buttons">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Todas
        </button>
        <button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>
          Próximas
        </button>
        <button className={filter === 'past' ? 'active' : ''} onClick={() => setFilter('past')}>
          Pasadas
        </button>
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <p>No tienes reservas {filter !== 'all' ? filter === 'upcoming' ? 'próximas' : 'pasadas' : ''}</p>
        </Card>
      ) : (
        <div className="reservations-grid">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="reservation-card">
              <div className="reservation-header">
                <h3>{reservation.business_name}</h3>
                <span className={`status-badge status-${reservation.status}`}>{reservation.status}</span>
              </div>
              
              <div className="reservation-details">
                <p>
                  <strong>Servicio:</strong> {reservation.service_name}
                </p>
                <p>
                  <strong>Fecha:</strong>{' '}
                  {new Date(reservation.start_time).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p>
                  <strong>Hora:</strong>{' '}
                  {new Date(reservation.start_time).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p>
                  <strong>Precio:</strong> {reservation.total_price}€
                </p>
              </div>

              {['pending', 'confirmed'].includes(reservation.status) && (
                <div className="reservation-actions">
                  <Button variant="outline" size="small" onClick={() => handleCancel(reservation.id)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReservationList
