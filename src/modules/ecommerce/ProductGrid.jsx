import { useState, useEffect, useCallback } from 'react'
import { getProducts } from '../../services/product'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'
import { Alert } from '../../components/common'

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">🛍️ Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1920px] mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        🛍️ Tienda LOBBA
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Left Column on Desktop */}
        <aside className="lg:w-72 flex-shrink-0">
          <ProductFilters onFilterChange={handleFilterChange} />
        </aside>

        {/* Products Area - Right Column on Desktop */}
        <div className="flex-1 min-w-0">
          {error && <Alert variant="error" className="mb-6">{error}</Alert>}
          
          {/* Filtering Indicator */}
          {isFiltering && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE6F5] dark:bg-[#4A1135] text-[#FF1493] rounded-full">
                <span className="animate-spin">🔄</span>
                <span className="font-medium">Filtrando productos...</span>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 ${isFiltering ? 'opacity-50 pointer-events-none' : ''}`}>
            {products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                  No se encontraron productos
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">
                  Intenta ajustar los filtros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductGrid
