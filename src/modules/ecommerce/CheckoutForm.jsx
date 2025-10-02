import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart } from '../../services/cart'
import { createPaymentIntent, confirmPayment, calculateShipping } from '../../services/checkout'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import './CheckoutForm.css'

const CheckoutForm = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [shippingCost, setShippingCost] = useState(0)
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
        const data = await getCart()
        setCart(data)
      } catch {
        // Error silently ignored
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  useEffect(() => {
    const fetchShippingCost = async () => {
      try {
        const data = await calculateShipping(shippingMethod)
        setShippingCost(data.cost || 0)
      } catch {
        // Error silently ignored
      }
    }

    fetchShippingCost()
  }, [shippingMethod])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setProcessing(true)
      const paymentIntent = await createPaymentIntent(shippingMethod)
      await confirmPayment(paymentIntent.clientSecret, shippingAddress, shippingMethod)
      navigate('/orders')
    } catch {
      // Error silently ignored
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="loading">Cargando checkout...</div>

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.base_price)
    const discount = parseFloat(item.discount_percentage || 0)
    const adjustment = parseFloat(item.price_adjustment || 0)
    const finalPrice = price * (1 - discount / 100) + adjustment
    return sum + (finalPrice * item.quantity)
  }, 0)

  const total = subtotal + shippingCost

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

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

            <Button type="submit" disabled={processing} className="checkout-button">
              {processing ? 'Procesando...' : 'Confirmar pedido'}
            </Button>
          </form>
        </Card>

        <Card className="order-summary">
          <h2>Resumen del pedido</h2>
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
            <div className="summary-row">
              <span>Envío</span>
              <span>{shippingCost.toFixed(2)}€</span>
            </div>
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

export default CheckoutForm
