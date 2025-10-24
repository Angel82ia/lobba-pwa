import PropTypes from 'prop-types'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { processReservationCheckout, confirmReservationPayment } from '../../services/reservationCheckout'
import { useStripePayment } from '../../hooks/useStripePayment'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Alert from '../../components/common/Alert'
import StripeCardElement from '../../components/common/StripeCardElement'

// Cargar Stripe de forma robusta
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const ReservationCheckoutContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { processPayment, processing, error, setError, isReady } = useStripePayment()

  // Datos de la reserva pasados desde ReservationCalendar
  const reservationData = location.state?.reservationData
  
  if (!reservationData) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">
          No hay datos de reserva. Por favor, vuelve a seleccionar un horario.
        </Alert>
        <Button onClick={() => navigate('/salones')} className="mt-4">
          Volver a salones
        </Button>
      </div>
    )
  }

  const {
    salon,
    service,
    selectedDate,
    selectedSlot,
    startTime,
    endTime,
    notes,
    clientPhone,
  } = reservationData

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isReady) {
      setError('Stripe no está cargado correctamente')
      return
    }

    try {
      // 1. Procesar checkout - Crear Payment Intent
      const checkoutResult = await processReservationCheckout({
        serviceId: service.id,
        startTime,
        endTime,
        notes,
        clientPhone: clientPhone?.trim() || undefined,
      })

      if (!checkoutResult.success || !checkoutResult.paymentIntent?.clientSecret) {
        throw new Error(checkoutResult.error || 'Error al crear el Payment Intent')
      }

      // 2. Confirmar el pago con Stripe usando el hook
      const paymentIntent = await processPayment(checkoutResult.paymentIntent.clientSecret)

      // 3. Confirmar la reserva en el backend
      const confirmResult = await confirmReservationPayment(paymentIntent.id)

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Error al confirmar la reserva')
      }

      // 4. Navegar a la página de éxito
      navigate('/reservations', { 
        state: { 
          message: '✅ Reserva confirmada y pago procesado exitosamente',
          reservationId: confirmResult.reservation.id,
        } 
      })

    } catch (err) {
      // Manejar error específico de slot no disponible
      if (err.message?.includes('SLOT_NO_LONGER_AVAILABLE')) {
        setError('⚠️ Lo sentimos, este horario acaba de ser reservado por otro usuario. ' + 
                 (err.message.includes('Refund') ? 'Se ha iniciado el reembolso automático.' : 'Por favor selecciona otro horario.'))
      } else {
        setError(err.message || 'Error al procesar el pago')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        💳 Confirmar y Pagar Reserva
      </h1>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de pago */}
        <div className="lg:col-span-2">
          <Card padding="large">
            <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Método de Pago
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Datos de la tarjeta
                </label>
                <StripeCardElement />
              </div>

              <Button 
                type="submit" 
                disabled={!isReady || processing}
                fullWidth
                size="large"
                className="mt-4"
              >
                {processing ? '⏳ Procesando pago...' : `💳 Pagar ${service.price}€`}
              </Button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                Al confirmar, aceptas los términos y condiciones del salón
              </p>
            </form>
          </Card>
        </div>

        {/* Resumen simplificado */}
        <ReservationSummary 
          salon={salon}
          service={service}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          notes={notes}
        />
      </div>
    </div>
  )
}

// Componente extraído para el resumen
const ReservationSummary = ({ salon, service, selectedDate, selectedSlot, notes }) => (
  <div className="lg:col-span-1">
    <Card padding="large" className="sticky top-8">
      <h2 className="font-primary text-xl font-bold text-gray-900 dark:text-white mb-4">
        📋 Resumen
      </h2>
      
      <div className="space-y-3 text-sm">
        <SummaryRow label="Salón" value={salon.businessName} />
        <SummaryRow label="Servicio" value={service.name} />
        <SummaryRow 
          label="Fecha" 
          value={new Date(selectedDate).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        />
        <SummaryRow label="Hora" value={selectedSlot} />
        <SummaryRow label="Duración" value={`${service.durationMinutes} minutos`} />
        
        {notes && <SummaryRow label="Notas" value={notes} />}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
            <span className="text-2xl font-bold text-[#FF1493]">{service.price}€</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pago único, sin cargos adicionales
          </p>
        </div>
      </div>
    </Card>
  </div>
)

ReservationSummary.propTypes = {
  salon: PropTypes.shape({
    businessName: PropTypes.string.isRequired,
  }).isRequired,
  service: PropTypes.shape({
    name: PropTypes.string.isRequired,
    durationMinutes: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
  }).isRequired,
  selectedDate: PropTypes.string.isRequired,
  selectedSlot: PropTypes.string.isRequired,
  notes: PropTypes.string,
}

const SummaryRow = ({ label, value }) => (
  <div>
    <p className="text-gray-500 dark:text-gray-400">{label}</p>
    <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
)

SummaryRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
}

const ReservationCheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <ReservationCheckoutContent />
    </Elements>
  )
}

export default ReservationCheckoutForm
