import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWishlist, removeFromWishlist } from '../../services/wishlist'
import { addToCart } from '../../services/cart'
import { Card, Button, Alert } from '../../components/common'

const Wishlist = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWishlist = async (signal = null) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWishlist(signal)
      if (!signal?.aborted) {
        setItems(data || [])
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError('Error al cargar la lista de deseos')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController()
    fetchWishlist(abortController.signal)
    
    return () => {
      abortController.abort()
    }
  }, [])

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId)
      setItems(items.filter(item => item.product_id !== productId))
    } catch (err) {
      setError('Error al eliminar el producto')
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, null, 1)
      navigate('/carrito')
    } catch (err) {
      setError('Error al añadir al carrito')
    }
  }

  const handleViewProduct = (slug) => {
    navigate(`/producto/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">❤️ Cargando lista de deseos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        ❤️ Mi Lista de Deseos
      </h1>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {items.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">💝</div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            Tu lista de deseos está vacía
          </p>
          <Button onClick={() => navigate('/tienda')}>
            Explorar Productos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const price = parseFloat(item.base_price)
            const discount = parseFloat(item.discount_percentage || 0)
            const finalPrice = price * (1 - discount / 100)

            return (
              <Card key={item.product_id} className="flex flex-col h-full" padding="none">
                {/* Image */}
                {item.image_url && (
                  <div 
                    className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer group"
                    onClick={() => handleViewProduct(item.slug)}
                  >
                    <img 
                      src={item.image_url} 
                      alt={item.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {discount > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
                          -{discount.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="flex flex-col flex-1 p-4 space-y-3">
                  <h3 
                    className="font-semibold text-lg text-gray-900 dark:text-white cursor-pointer hover:text-[#FF1493] transition-colors line-clamp-2"
                    onClick={() => handleViewProduct(item.slug)}
                  >
                    {item.product_name}
                  </h3>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
                      {item.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    {discount > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {price.toFixed(2)}€
                      </span>
                    )}
                    <span className="text-2xl font-bold text-[#FF1493]">
                      {finalPrice.toFixed(2)}€
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleAddToCart(item.product_id)}
                      fullWidth
                      size="small"
                    >
                      🛒 Al Carrito
                    </Button>
                    <Button 
                      onClick={() => handleRemove(item.product_id)}
                      variant="outline"
                      size="small"
                      className="flex-shrink-0"
                    >
                      ❌
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Wishlist
