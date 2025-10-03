import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById } from '../../services/product'
import { addToCart } from '../../services/cart'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import './ProductDetail.css'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getProductById(slug)
        setProduct(data)
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el producto')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true)
      setError('')
      await addToCart(product.id, selectedVariant?.id, quantity)
      navigate('/carrito')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al añadir al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) return <div className="loading">Cargando producto...</div>
  if (error && !product) return <div className="error">Error: {error}</div>

  const price = parseFloat(product.base_price)
  const discount = parseFloat(product.discount_percentage || 0)
  const variantAdjustment = selectedVariant ? parseFloat(selectedVariant.price_adjustment || 0) : 0
  const finalPrice = (price * (1 - discount / 100) + variantAdjustment).toFixed(2)

  return (
    <div className="product-detail">
      <Card>
        {error && <div className="error-message">{error}</div>}

        <div className="product-detail-grid">
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={product.images?.[selectedImageIndex]?.image_url || '/placeholder.png'}
                alt={product.name}
              />
            </div>
            <div className="thumbnail-list">
              {product.images?.map((img, idx) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.alt_text || product.name}
                  className={idx === selectedImageIndex ? 'active' : ''}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          </div>

          <div className="product-info-detail">
            <p className="brand">LOBBA</p>
            <h1>{product.name}</h1>
            
            <div className="pricing">
              {discount > 0 && <span className="original-price">{price.toFixed(2)}€</span>}
              <span className="final-price">{finalPrice}€</span>
            </div>

            <p className="description">{product.description}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="variant-selector">
                <label>Variante</label>
                <div className="variants">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`variant-option ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="quantity-selector">
              <label>Cantidad</label>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock_quantity === 0}
              className="add-to-cart-large"
            >
              {addingToCart ? 'Añadiendo...' : 'Añadir al carrito'}
            </Button>

            <div className="product-meta">
              <p><strong>Stock:</strong> {product.stock_quantity} unidades</p>
              <p><strong>SKU:</strong> {selectedVariant?.sku || product.id}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProductDetail
