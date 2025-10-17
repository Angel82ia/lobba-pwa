import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSalonProfile, getSalonServices } from '../../services/profile'
import { getAvailableSlots, createReservation } from '../../services/reservation'
import { Button, Card, Input, Textarea, Alert } from '../../components/common'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
      </div>
    )
  }

  if (error && !salon) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
          Nueva Reserva en {salon?.businessName}
        </h1>
        
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Servicios */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Selecciona un Servicio
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedService?.id === service.id
                      ? 'border-[#FF1493] bg-[#FFE6F5] dark:bg-[#4A1135] shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#FF1493] hover:shadow-md'
                  }`}
                  onClick={() => setSelectedService(service)}
                >
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {service.durationMinutes} min • <span className="font-bold text-[#FF1493]">{service.price}€</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fecha */}
          {selectedService && (
            <div>
              <label htmlFor="date" className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecciona una Fecha
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Horarios */}
          {selectedService && selectedDate && (
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecciona una Hora
              </label>
              {loadingSlots ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  ⏳ Cargando horarios disponibles...
                </p>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                        selectedSlot === slot
                          ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30 scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    😔 No hay horarios disponibles para esta fecha
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    Intenta con otra fecha
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Detalles adicionales */}
          {selectedSlot && (
            <>
              <Textarea
                label="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Añade cualquier comentario o preferencia..."
                maxLength={500}
                fullWidth
              />

              <Input
                label="Teléfono de Contacto"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+34 123 456 789"
                fullWidth
              />

              {/* Resumen */}
              <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700" padding="medium">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                  📋 Resumen de tu Reserva
                </h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>Servicio:</strong> {selectedService.name}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Hora:</strong> {selectedSlot}</p>
                  <p><strong>Duración:</strong> {selectedService.durationMinutes} minutos</p>
                  <p className="text-xl font-bold text-[#FF1493] mt-3">
                    Total: {selectedService.price}€
                  </p>
                </div>
              </Card>

              {/* Botón de confirmación */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  fullWidth
                  size="large"
                >
                  {submitting ? 'Reservando...' : '✓ Confirmar Reserva'}
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
