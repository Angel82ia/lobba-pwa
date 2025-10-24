import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'

export const useStripePayment = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const processPayment = async (clientSecret, additionalData = {}) => {
    if (!stripe || !elements) {
      throw new Error('Stripe no está cargado correctamente')
    }

    setError('')
    setProcessing(true)

    try {
      const cardElement = elements.getElement(CardElement)

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          ...additionalData,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('El pago no se completó correctamente')
      }

      return paymentIntent
    } catch (err) {
      setError(err.message || 'Error al procesar el pago')
      throw err
    } finally {
      setProcessing(false)
    }
  }

  return {
    processPayment,
    processing,
    error,
    setError,
    isReady: !!(stripe && elements),
  }
}

// Hook para obtener configuración común de CardElement
export const useCardElementOptions = () => {
  return {
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
}
