import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWishlist, removeFromWishlist } from '../../services/wishlist'
import { addToCart } from '../../services/cart'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './Wishlist.css'

const Wishlist = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWishlist()
      setItems(data || [])
    } catch (err) {
      setError('Error al cargar la lista de deseos')
    } finally {
      setLoading(false)
    }
  }

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
      await addToCart(productId, 1)
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
      <div className="wishlist-container">
        <h1>Mi Lista de Deseos</h1>
        <p className="loading-message">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="wishlist-container">
      <h1>Mi Lista de Deseos</h1>
      
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <Card className="empty-wishlist">
          <p>Tu lista de deseos está vacía</p>
          <Button onClick={() => navigate('/tienda')}>
            Explorar Productos
          </Button>
        </Card>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <Card key={item.product_id} className="wishlist-item">
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.product_name}
                  className="wishlist-item-image"
                  onClick={() => handleViewProduct(item.slug)}
                />
              )}
              
              <div className="wishlist-item-details">
                <h3 
                  className="wishlist-item-name"
                  onClick={() => handleViewProduct(item.slug)}
                >
                  {item.product_name}
                </h3>
                
                {item.description && (
                  <p className="wishlist-item-description">
                    {item.description.substring(0, 100)}
                    {item.description.length > 100 ? '...' : ''}
                  </p>
                )}

                <div className="wishlist-item-price">
                  {item.discount_percentage > 0 ? (
                    <>
                      <span className="original-price">
                        {parseFloat(item.base_price).toFixed(2)}€
                      </span>
                      <span className="discounted-price">
                        {(parseFloat(item.base_price) * (1 - item.discount_percentage / 100)).toFixed(2)}€
                      </span>
                      <span className="discount-badge">
                        -{item.discount_percentage}%
                      </span>
                    </>
                  ) : (
                    <span className="price">
                      {parseFloat(item.base_price).toFixed(2)}€
                    </span>
                  )}
                </div>

                <div className="wishlist-item-actions">
                  <Button 
                    onClick={() => handleAddToCart(item.product_id)}
                    className="add-to-cart-button"
                  >
                    Añadir al Carrito
                  </Button>
                  <Button 
                    onClick={() => handleRemove(item.product_id)}
                    variant="secondary"
                    className="remove-button"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist
