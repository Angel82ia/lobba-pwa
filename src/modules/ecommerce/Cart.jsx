import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateCartItem, removeFromCart } from '../../services/cart'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import './Cart.css'

const Cart = () => {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchCart = async (signal = null) => {
    try {
      setLoading(true)
      setError('')
      const data = await getCart(signal)
      if (!signal?.aborted) {
        setCart(data)
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err.response?.data?.message || 'Error al cargar el carrito')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController()
    fetchCart(abortController.signal)
    
    return () => {
      abortController.abort()
    }
  }, [])

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      await updateCartItem(itemId, quantity)
      await fetchCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la cantidad')
    }
  }

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId)
      await fetchCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el producto')
    }
  }

  if (loading) return <div className="loading">Cargando carrito...</div>

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.base_price)
    const discount = parseFloat(item.discount_percentage || 0)
    const adjustment = parseFloat(item.price_adjustment || 0)
    const finalPrice = price * (1 - discount / 100) + adjustment
    return sum + (finalPrice * item.quantity)
  }, 0)

  return (
    <div className="cart-page">
      <Card>
        <h1>Carrito de Compras</h1>

        {error && <div className="error-message">{error}</div>}

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Tu carrito está vacío</p>
            <Link to="/tienda">
              <Button>Ir a la tienda</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => {
                const price = parseFloat(item.base_price)
                const discount = parseFloat(item.discount_percentage || 0)
                const adjustment = parseFloat(item.price_adjustment || 0)
                const finalPrice = price * (1 - discount / 100) + adjustment

                return (
                  <div key={item.id} className="cart-item">
                    <img src={item.image_url || '/placeholder.png'} alt={item.product_name} />
                    
                    <div className="item-info">
                      <h3>{item.product_name}</h3>
                      {item.variant_name && <p className="variant">{item.variant_name}</p>}
                      <p className="price">{finalPrice.toFixed(2)}€</p>
                    </div>

                    <div className="item-quantity">
                      <button onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      <p>{(finalPrice * item.quantity).toFixed(2)}€</p>
                    </div>

                    <button className="remove-button" onClick={() => handleRemove(item.id)}>
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>

              <Button onClick={() => navigate('/checkout')} className="checkout-button">
                Proceder al pago
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default Cart
