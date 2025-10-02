import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { addToCart } from '../../services/cart'
import { addToWishlist, removeFromWishlist } from '../../services/wishlist'
import Button from '../../components/common/Button'
import './ProductCard.css'

const ProductCard = ({ product, isInWishlist = false, onWishlistToggle }) => {
  const [loading, setLoading] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const price = parseFloat(product.base_price)
  const discount = parseFloat(product.discount_percentage || 0)
  const finalPrice = price * (1 - discount / 100)
  const primaryImage = product.images?.find(img => img.is_primary)?.image_url || '/placeholder.png'

  const handleAddToCart = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await addToCart(product.id, null, 1)
    } catch {
      // Error silently ignored
    } finally {
      setLoading(false)
    }
  }

  const handleWishlistToggle = async (e) => {
    e.preventDefault()
    try {
      setWishlistLoading(true)
      if (isInWishlist) {
        await removeFromWishlist(product.id)
      } else {
        await addToWishlist(product.id)
      }
      if (onWishlistToggle) onWishlistToggle()
    } catch {
      // Error silently ignored
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <Link to={`/producto/${product.slug}`} className="product-card">
      <div className="product-image-container">
        <img src={primaryImage} alt={product.name} className="product-image" />
        {product.is_new && <span className="badge badge-new">NUEVO</span>}
        {discount > 0 && <span className="badge badge-discount">-{discount.toFixed(0)}%</span>}
        <button
          className={`wishlist-button ${isInWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label="Toggle wishlist"
        >
          ❤
        </button>
      </div>
      
      <div className="product-info">
        <p className="product-brand">LOBBA</p>
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-pricing">
          {discount > 0 && <span className="original-price">{price.toFixed(2)}€</span>}
          <span className="final-price">{finalPrice.toFixed(2)}€</span>
        </div>

        {product.variants && product.variants.length > 0 && (
          <div className="product-variants">
            {product.variants.slice(0, 5).map(variant => (
              <span
                key={variant.id}
                className="variant-color"
                style={{ backgroundColor: variant.color }}
                title={variant.name}
              />
            ))}
          </div>
        )}

        <Button
          onClick={handleAddToCart}
          disabled={loading || product.stock_quantity === 0}
          className="add-to-cart-button"
        >
          {loading ? 'Añadiendo...' : 'Añadir al carrito'}
        </Button>
      </div>
    </Link>
  )
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    base_price: PropTypes.string.isRequired,
    discount_percentage: PropTypes.string,
    stock_quantity: PropTypes.number.isRequired,
    is_new: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.shape({
      image_url: PropTypes.string,
      is_primary: PropTypes.bool,
    })),
    variants: PropTypes.arrayOf(PropTypes.shape({
      color: PropTypes.string,
    })),
  }).isRequired,
  isInWishlist: PropTypes.bool,
  onWishlistToggle: PropTypes.func.isRequired,
}

export default ProductCard
