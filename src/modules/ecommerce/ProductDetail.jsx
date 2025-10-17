import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById } from '../../services/product'
import { addToCart } from '../../services/cart'
import { Button, Card, Alert } from '../../components/common'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">🔍 Cargando producto...</p>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Alert variant="error">Error: {error}</Alert>
      </div>
    )
  }

  const price = parseFloat(product.base_price)
  const discount = parseFloat(product.discount_percentage || 0)
  const variantAdjustment = selectedVariant ? parseFloat(selectedVariant.price_adjustment || 0) : 0
  const finalPrice = (price * (1 - discount / 100) + variantAdjustment).toFixed(2)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <Card padding="large">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
              <img
                src={product.images?.[selectedImageIndex]?.image_url || '/placeholder.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? 'border-[#FF1493] scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#FF1493]/50'
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-[#FF1493] uppercase tracking-wider mb-2">
                LOBBA
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {product.name}
              </h1>
              
              {/* Pricing */}
              <div className="flex items-baseline gap-3 mb-6">
                {discount > 0 && (
                  <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                    {price.toFixed(2)}€
                  </span>
                )}
                <span className="text-4xl font-bold text-[#FF1493]">
                  {finalPrice}€
                </span>
                {discount > 0 && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white">
                    -{discount.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Variante
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#FF1493] bg-[#FFE6F5] dark:bg-[#4A1135] text-[#FF1493] shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#FF1493]'
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Cantidad
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold hover:bg-[#FF1493] hover:text-white transition-colors flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <span className="font-bold text-xl text-gray-900 dark:text-white min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold hover:bg-[#FF1493] hover:text-white transition-colors flex items-center justify-center text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock_quantity === 0}
              fullWidth
              size="large"
              variant={product.stock_quantity === 0 ? 'outline' : 'primary'}
            >
              {addingToCart ? '⏳ Añadiendo...' : product.stock_quantity === 0 ? 'Agotado' : '🛒 Añadir al carrito'}
            </Button>

            {/* Product Meta */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-white">Stock:</strong> {product.stock_quantity} unidades disponibles
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">SKU:</strong> {selectedVariant?.sku || product.id}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProductDetail
