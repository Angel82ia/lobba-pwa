import { useState, useEffect, useCallback } from 'react'
import { getProducts } from '../../services/product'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'
import './ProductGrid.css'

const ProductGrid = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({})
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchProducts = async () => {
      try {
        // Si ya cargamos una vez, mostrar indicador de filtrado
        if (hasLoadedOnce) {
          setIsFiltering(true)
        } else {
          setLoading(true)
        }
        setError('')
        const data = await getProducts(filters, abortController.signal)
        if (!abortController.signal.aborted) {
          setProducts(data)
          if (!hasLoadedOnce) {
            setHasLoadedOnce(true)
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err.response?.data?.message || 'Error al cargar los productos')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
          setIsFiltering(false)
        }
      }
    }

    fetchProducts()
    
    return () => {
      abortController.abort()
    }
  }, [filters, hasLoadedOnce])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  // Solo mostrar loading completo en la carga inicial
  if (loading && products.length === 0) {
    return <div className="loading">Cargando productos...</div>
  }

  return (
    <div className="product-grid-container">
      <ProductFilters onFilterChange={handleFilterChange} />
      
      {error && <div className="error-message">{error}</div>}
      
      {isFiltering && (
        <div className="filtering-indicator">
          <span>🔄 Filtrando productos...</span>
        </div>
      )}

      <div className={`product-grid ${isFiltering ? 'filtering' : ''}`}>
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="no-products">
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductGrid
