import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { addToCart } from '../../services/cart'
import { addToWishlist, removeFromWishlist } from '../../services/wishlist'
import { Button } from '../../components/common'

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
    <Link 
      to={`/producto/${product.slug}`} 
      className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img 
          src={primaryImage} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_new && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
              NUEVO
            </span>
          )}
          {discount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
              -{discount.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isInWishlist 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
          } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label="Toggle wishlist"
        >
          <span className="text-xl">{isInWishlist ? '❤️' : '🤍'}</span>
        </button>

        {/* Out of Stock Overlay */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg px-4 py-2 bg-red-600 rounded-lg">
              AGOTADO
            </span>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs font-semibold text-[#FF1493] uppercase tracking-wider mb-1">
          LOBBA
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-4">
          {discount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              {price.toFixed(2)}€
            </span>
          )}
          <span className="text-xl font-bold text-[#FF1493]">
            {finalPrice.toFixed(2)}€
          </span>
        </div>

        {/* Color Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {product.variants.slice(0, 5).map(variant => (
              <span
                key={variant.id}
                className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: variant.color }}
                title={variant.name}
              />
            ))}
            {product.variants.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{product.variants.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={loading || product.stock_quantity === 0}
          fullWidth
          size="small"
          variant={product.stock_quantity === 0 ? 'outline' : 'primary'}
        >
          {loading ? '⏳ Añadiendo...' : product.stock_quantity === 0 ? 'Agotado' : '🛒 Añadir al carrito'}
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
      id: PropTypes.string,
      name: PropTypes.string,
      color: PropTypes.string,
    })),
  }).isRequired,
  isInWishlist: PropTypes.bool,
  onWishlistToggle: PropTypes.func,
}

export default ProductCard
