import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSalonProfile, getSalonServices } from '../../services/profile'
import { getAvailableSlots, createReservation } from '../../services/reservation'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import './ReservationCalendar.css'

const ReservationCalendar = () => {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [salonData, servicesData] = await Promise.all([
          getSalonProfile(salonId),
          getSalonServices(salonId),
        ])
        setSalon(salonData)
        setServices(servicesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [salonId])

  const fetchSlots = useCallback(async () => {
    try {
      setLoadingSlots(true)
      const slots = await getAvailableSlots(salonId, selectedService.id, selectedDate)
      setAvailableSlots(slots)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSlots(false)
    }
  }, [salonId, selectedService, selectedDate])

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchSlots()
    }
  }, [selectedService, selectedDate, fetchSlots])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedSlot) {
      setError('Por favor completa todos los campos')
      return
    }

    try {
      setSubmitting(true)
      const [hours, minutes] = selectedSlot.split(':')
      const startTime = new Date(selectedDate)
      startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + selectedService.durationMinutes)

      await createReservation({
        salonProfileId: salonId,
        serviceId: selectedService.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalPrice: selectedService.price,
        notes,
        clientPhone,
      })

      navigate('/reservations')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="reservation-calendar">
      <Card>
        <h1>Nueva Reserva en {salon?.businessName}</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Selecciona un Servicio</label>
            <div className="services-grid">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`service-option ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <h3>{service.name}</h3>
                  <p>{service.durationMinutes} min - {service.price}€</p>
                </div>
              ))}
            </div>
          </div>

          {selectedService && (
            <div className="form-group">
              <label htmlFor="date">Selecciona una Fecha</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          )}

          {selectedService && selectedDate && (
            <div className="form-group">
              <label>Selecciona una Hora</label>
              {loadingSlots ? (
                <p>Cargando horarios...</p>
              ) : availableSlots.length > 0 ? (
                <div className="slots-grid">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-button ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p>No hay horarios disponibles para esta fecha</p>
              )}
            </div>
          )}

          {selectedSlot && (
            <>
              <Input
                label="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
              />

              <Input
                label="Teléfono de Contacto"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+34 123 456 789"
              />

              <div className="form-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Reservando...' : 'Confirmar Reserva'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}

export default ReservationCalendar
