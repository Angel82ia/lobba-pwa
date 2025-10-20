import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { processReservationCheckout, confirmReservationPayment } from '../../services/reservationCheckout'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Alert from '../../components/common/Alert'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const ReservationCheckoutContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const stripe = useStripe()
  const elements = useElements()

  // Datos de la reserva pasados desde ReservationCalendar
  const reservationData = location.state?.reservationData
  
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

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
    
    if (!stripe || !elements) {
      setError('Stripe no está cargado correctamente')
      return
    }

    setError('')
    setProcessing(true)

    try {
      // 1. Procesar checkout - Crear Payment Intent
      const checkoutResult = await processReservationCheckout({
        serviceId: service.id,
        startTime,
        endTime,
        notes,
        clientPhone,
      })

      if (!checkoutResult.success || !checkoutResult.paymentIntent?.clientSecret) {
        throw new Error(checkoutResult.error || 'Error al crear el Payment Intent')
      }

      const cardElement = elements.getElement(CardElement)

      // 2. Confirmar el pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        checkoutResult.paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('El pago no se completó correctamente')
      }

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
      // Error en checkout
      
      // Manejar error específico de slot no disponible
      if (err.message?.includes('SLOT_NO_LONGER_AVAILABLE')) {
        setError('⚠️ Lo sentimos, este horario acaba de ser reservado por otro usuario. ' + 
                 (err.message.includes('Refund') ? 'Se ha iniciado el reembolso automático.' : 'Por favor selecciona otro horario.'))
      } else {
        setError(err.message || 'Error al procesar el pago')
      }
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Inter", sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146',
      },
    },
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
                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus-within:border-[#FF1493] transition-colors">
                  <CardElement options={cardElementOptions} />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  🔒 Pago seguro procesado por Stripe
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={!stripe || processing}
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

        {/* Resumen de la reserva */}
        <div className="lg:col-span-1">
          <Card padding="large" className="sticky top-8">
            <h2 className="font-primary text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Resumen
            </h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Salón</p>
                <p className="font-semibold text-gray-900 dark:text-white">{salon.businessName}</p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Servicio</p>
                <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Fecha</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(selectedDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Hora</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedSlot}</p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Duración</p>
                <p className="font-semibold text-gray-900 dark:text-white">{service.durationMinutes} minutos</p>
              </div>

              {notes && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Notas</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
                </div>
              )}

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
      </div>
    </div>
  )
}

const ReservationCheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <ReservationCheckoutContent />
    </Elements>
  )
}

export default ReservationCheckoutForm

