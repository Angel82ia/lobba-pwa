import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSalonProfile, getSalonServices } from '../../services/profile'
import { getAvailableSlots } from '../../services/reservation'
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
  const [fieldErrors, setFieldErrors] = useState({})

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

  // Función de sanitización de inputs
  const sanitizeInput = (input) => {
    if (!input) return ''
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover < y >
      .substring(0, 500) // Limitar longitud
  }

  // Función de validación de teléfono
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return true // Opcional - permitir vacío
    const trimmedPhone = phone.trim()
    const phoneRegex = /^\+?[0-9\s\-()]{9,15}$/
    return phoneRegex.test(trimmedPhone)
  }

  // Función de validación completa del formulario
  const validateForm = () => {
    const errors = {}
    
    // Validar servicio
    if (!selectedService) {
      errors.service = 'Debes seleccionar un servicio'
    }
    
    // Validar fecha
    if (!selectedDate) {
      errors.date = 'Debes seleccionar una fecha'
    } else {
      const selectedDateTime = new Date(selectedDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDateTime < today) {
        errors.date = 'La fecha no puede ser en el pasado'
      }
      
      // Validar no más de 6 meses en el futuro
      const maxDate = new Date()
      maxDate.setMonth(maxDate.getMonth() + 6)
      if (selectedDateTime > maxDate) {
        errors.date = 'La fecha no puede ser más de 6 meses en el futuro'
      }
    }
    
    // Validar slot
    if (!selectedSlot) {
      errors.slot = 'Debes seleccionar un horario'
    }
    
    // Validar teléfono
    if (clientPhone && clientPhone.trim() !== '' && !validatePhone(clientPhone)) {
      errors.phone = 'Formato de teléfono inválido (9-15 dígitos)'
    }
    
    // Validar notas
    if (notes && notes.length > 500) {
      errors.notes = 'Las notas no pueden exceder 500 caracteres'
    }
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setError(null)
    setFieldErrors({})
    
    // Validar formulario
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setError('Por favor corrige los errores en el formulario')
      return
    }

    try {
      setSubmitting(true)
      const [hours, minutes] = selectedSlot.split(':')
      
      // Crear fecha en zona horaria local
      const [year, month, day] = selectedDate.split('-')
      const startTime = new Date(
        parseInt(year),
        parseInt(month) - 1, // Mes es 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      )
      
      const endTime = new Date(startTime.getTime() + selectedService.durationMinutes * 60000)

      // Formatear fechas manteniendo la zona horaria local con offset
      // Formato: YYYY-MM-DDTHH:mm:ss+02:00 (con offset de zona horaria)
      const formatLocalDateTime = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        
        // Obtener offset de zona horaria (ej: -120 para UTC+2)
        const offset = -date.getTimezoneOffset()
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0')
        const offsetSign = offset >= 0 ? '+' : '-'
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`
      }

      // Redirigir al checkout de pago con los datos de la reserva
      navigate('/reservation-checkout', {
        state: {
          reservationData: {
            salon,
            service: selectedService,
            selectedDate,
            selectedSlot,
            startTime: formatLocalDateTime(startTime),
            endTime: formatLocalDateTime(endTime),
            notes: sanitizeInput(notes),
            clientPhone: clientPhone?.trim() || null,
          }
        }
      })
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
              Selecciona un Servicio *
            </label>
            {fieldErrors.service && (
              <p className="text-red-500 text-sm mb-2">⚠️ {fieldErrors.service}</p>
            )}
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
                Selecciona una Fecha *
              </label>
              {fieldErrors.date && (
                <p className="text-red-500 text-sm mb-2">⚠️ {fieldErrors.date}</p>
              )}
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  if (fieldErrors.date) {
                    setFieldErrors({ ...fieldErrors, date: null })
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  fieldErrors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent transition-all`}
              />
            </div>
          )}

          {/* Horarios */}
          {selectedService && selectedDate && (
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecciona una Hora *
              </label>
              {fieldErrors.slot && (
                <p className="text-red-500 text-sm mb-2">⚠️ {fieldErrors.slot}</p>
              )}
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
              <div>
                <Textarea
                  label="Notas (opcional)"
                  value={notes}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value)
                    setNotes(sanitized)
                    if (fieldErrors.notes) {
                      setFieldErrors({ ...fieldErrors, notes: null })
                    }
                  }}
                  rows={3}
                  placeholder="Añade cualquier comentario o preferencia..."
                  maxLength={500}
                  fullWidth
                  error={fieldErrors.notes}
                />
                <div className="flex justify-between items-center mt-1">
                  {fieldErrors.notes && (
                    <p className="text-red-500 text-sm">⚠️ {fieldErrors.notes}</p>
                  )}
                  <p className={`text-sm ml-auto ${notes.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                    {notes.length} / 500 caracteres
                  </p>
                </div>
              </div>

              <div>
                <Input
                  label="Teléfono de Contacto (opcional)"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value)
                    setClientPhone(sanitized)
                    if (fieldErrors.phone) {
                      setFieldErrors({ ...fieldErrors, phone: null })
                    }
                  }}
                  placeholder="+34 123 456 789"
                  fullWidth
                  error={fieldErrors.phone}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">⚠️ {fieldErrors.phone}</p>
                )}
                {clientPhone && clientPhone.trim() !== '' && !fieldErrors.phone && validatePhone(clientPhone) && (
                  <p className="text-green-500 text-sm mt-1">✅ Formato válido</p>
                )}
                {clientPhone && clientPhone.trim() !== '' && !validatePhone(clientPhone) && !fieldErrors.phone && (
                  <p className="text-orange-500 text-sm mt-1">⚠️ Verifica el formato del teléfono</p>
                )}
              </div>

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

              {/* Botón de continuar al pago */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  fullWidth
                  size="large"
                >
                  {submitting ? 'Procesando...' : '💳 Continuar al Pago'}
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  En el siguiente paso realizarás el pago seguro con tarjeta
                </p>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}

export default ReservationCalendar
