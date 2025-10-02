import { useState, useEffect } from 'react'
import { getProducts } from '../../services/product'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'
import './ProductGrid.css'

const ProductGrid = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getProducts(filters)
        setProducts(data)
      } catch {
        // Error silently ignored
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return <div className="loading">Cargando productos...</div>
  }

  return (
    <div className="product-grid-container">
      <ProductFilters onFilterChange={handleFilterChange} />
      
      <div className="product-grid">
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
