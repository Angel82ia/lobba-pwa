import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getCart } from '../../services/cart'
import { createPaymentIntent, confirmPayment } from '../../services/checkout'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import './CheckoutForm.css'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

const CheckoutFormContent = () => {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [checkoutData, setCheckoutData] = useState(null)
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'ES',
  })

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getCart()
        setCart(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el carrito')
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  useEffect(() => {
    const fetchCheckoutData = async () => {
      if (!cart || cart.items.length === 0) return

      try {
        const data = await createPaymentIntent(shippingMethod)
        setCheckoutData(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Error al calcular totales')
      }
    }

    fetchCheckoutData()
  }, [cart, shippingMethod])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      setError('Stripe no está cargado correctamente')
      return
    }

    setError('')
    setProcessing(true)

    try {
      const cardElement = elements.getElement(CardElement)

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        checkoutData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingAddress.name,
              address: {
                line1: shippingAddress.street,
                city: shippingAddress.city,
                postal_code: shippingAddress.postal_code,
                country: shippingAddress.country,
              },
            },
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      await confirmPayment(paymentIntent.id, shippingAddress, shippingMethod)

      navigate('/orders', { 
        state: { 
          message: 'Pedido realizado con éxito', 
          orderNumber: paymentIntent.id 
        } 
      })

    } catch (err) {
      setError(err.message || 'Error al procesar el pago')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="loading">Cargando checkout...</div>
  }

  if (error && !cart) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <Card>
          <div className="error-message">{error}</div>
          <Button onClick={() => navigate('/products')}>Ver productos</Button>
        </Card>
      </div>
    )
  }

  const items = cart?.items || []
  
  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <Card>
          <p>Tu carrito está vacío</p>
          <Button onClick={() => navigate('/products')}>Ver productos</Button>
        </Card>
      </div>
    )
  }

  const subtotal = checkoutData?.subtotal || 0
  const membershipDiscount = checkoutData?.membershipDiscount || 0
  const membershipType = checkoutData?.membershipType
  const shippingCost = checkoutData?.shippingCost || 0
  const freeShipping = checkoutData?.freeShipping || false
  const total = checkoutData?.total || 0

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="checkout-grid">
        <Card className="checkout-form">
          <h2>Dirección de envío</h2>
          <form onSubmit={handleSubmit}>
            <Input
              label="Nombre completo"
              value={shippingAddress.name}
              onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
              required
            />
            <Input
              label="Dirección"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              required
            />
            <Input
              label="Ciudad"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              required
            />
            <Input
              label="Código postal"
              value={shippingAddress.postal_code}
              onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
              required
            />

            <h3>Método de envío</h3>
            <div className="shipping-methods">
              <label className={`shipping-method ${shippingMethod === 'standard' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                />
                <div>
                  <strong>Envío Estándar</strong>
                  <span>3-5 días laborables</span>
                </div>
              </label>

              <label className={`shipping-method ${shippingMethod === 'express' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                />
                <div>
                  <strong>Envío Exprés</strong>
                  <span>24-48 horas</span>
                </div>
              </label>

              <label className={`shipping-method ${shippingMethod === 'click_collect' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="click_collect"
                  checked={shippingMethod === 'click_collect'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                />
                <div>
                  <strong>Click & Collect</strong>
                  <span>Recoge en salón</span>
                </div>
              </label>
            </div>

            <h3>Método de pago</h3>
            <div className="card-element-container">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!stripe || processing || !checkoutData} 
              className="checkout-button"
            >
              {processing ? 'Procesando...' : `Pagar ${total.toFixed(2)}€`}
            </Button>
          </form>
        </Card>

        <Card className="order-summary">
          <h2>Resumen del pedido</h2>
          
          {membershipType && (
            <div className="membership-badge">
              <span className={`badge-${membershipType}`}>
                {membershipType === 'spirit' ? '👑 Membresía Spirit' : '✨ Membresía Essential'}
              </span>
            </div>
          )}

          <div className="summary-items">
            {items.map((item) => {
              const price = parseFloat(item.base_price)
              const discount = parseFloat(item.discount_percentage || 0)
              const adjustment = parseFloat(item.price_adjustment || 0)
              const finalPrice = price * (1 - discount / 100) + adjustment

              return (
                <div key={item.id} className="summary-item">
                  <span>{item.product_name} x {item.quantity}</span>
                  <span>{(finalPrice * item.quantity).toFixed(2)}€</span>
                </div>
              )
            })}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>

            {membershipDiscount > 0 && (
              <div className="summary-row discount">
                <span>Descuento Membresía ({membershipType === 'spirit' ? '15%' : '10%'})</span>
                <span className="discount-amount">-{membershipDiscount.toFixed(2)}€</span>
              </div>
            )}

            <div className="summary-row">
              <span>Envío</span>
              {freeShipping ? (
                <span className="free-shipping">GRATIS ✓</span>
              ) : (
                <span>{shippingCost.toFixed(2)}€</span>
              )}
            </div>

            {freeShipping && membershipType && (
              <div className="shipping-info">
                <small>
                  Envío gratis por membresía {membershipType === 'spirit' ? 'Spirit (>15€)' : 'Essential (>30€)'}
                </small>
              </div>
            )}

            <div className="summary-row total">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

const CheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent />
    </Elements>
  )
}

export default CheckoutForm
