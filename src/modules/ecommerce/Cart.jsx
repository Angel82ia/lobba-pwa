import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateCartItem, removeFromCart } from '../../services/cart'
import { Button, Card, Alert } from '../../components/common'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">🛒 Cargando carrito...</p>
      </div>
    )
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.base_price)
    const discount = parseFloat(item.discount_percentage || 0)
    const adjustment = parseFloat(item.price_adjustment || 0)
    const finalPrice = price * (1 - discount / 100) + adjustment
    return sum + (finalPrice * item.quantity)
  }, 0)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        🛒 Carrito de Compras
      </h1>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {items.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">🛍️</div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Tu carrito está vacío
          </p>
          <Link to="/tienda">
            <Button>Ir a la tienda</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const price = parseFloat(item.base_price)
              const discount = parseFloat(item.discount_percentage || 0)
              const adjustment = parseFloat(item.price_adjustment || 0)
              const finalPrice = price * (1 - discount / 100) + adjustment

              return (
                <Card key={item.id} padding="medium" className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Image */}
                  <img 
                    src={item.image_url || '/placeholder.png'} 
                    alt={item.product_name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                      {item.product_name}
                    </h3>
                    {item.variant_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="text-lg font-bold text-[#FF1493]">
                      {finalPrice.toFixed(2)}€
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 text-gray-700 dark:text-white font-bold hover:bg-[#FF1493] hover:text-white transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 text-gray-700 dark:text-white font-bold hover:bg-[#FF1493] hover:text-white transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(finalPrice * item.quantity).toFixed(2)}€
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all flex-shrink-0" 
                    onClick={() => handleRemove(item.id)}
                    aria-label="Eliminar producto"
                  >
                    ✕
                  </button>
                </Card>
              )
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card padding="large" className="sticky top-8">
              <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Resumen
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Envío</span>
                  <span className="font-semibold">Gratis</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between text-lg">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-[#FF1493] text-2xl">{subtotal.toFixed(2)}€</span>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/checkout')} 
                fullWidth
                size="large"
              >
                💳 Proceder al pago
              </Button>

              <Link to="/tienda">
                <Button variant="outline" fullWidth size="medium" className="mt-3">
                  ← Seguir comprando
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
