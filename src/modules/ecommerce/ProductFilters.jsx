import { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { getCategories } from '../../services/product'
import './ProductFilters.css'

const ProductFilters = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('created_at')
  const [showNewOnly, setShowNewOnly] = useState(false)
  const onFilterChangeRef = useRef(onFilterChange)

  // Mantener la ref actualizada
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange
  }, [onFilterChange])

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()
    
    const fetchCategories = async () => {
      try {
        const data = await getCategories(abortController.signal)
        if (isMounted && !abortController.signal.aborted) {
          setCategories(data)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Error al cargar categorías:', err)
          // Las categorías son opcionales, no bloqueamos la UI
        }
      }
    }

    fetchCategories()
    
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [])

  // Debounce para los filtros de precio
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters = {
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        ...(showNewOnly && { isNew: 'true' }),
        sortBy,
      }

      onFilterChangeRef.current(filters)
    }, 500) // Espera 500ms después del último cambio

    return () => clearTimeout(timeoutId)
  }, [selectedCategory, priceRange.min, priceRange.max, sortBy, showNewOnly])

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value)
  }, [])

  const handleMinPriceChange = useCallback((e) => {
    setPriceRange(prev => ({ ...prev, min: e.target.value }))
  }, [])

  const handleMaxPriceChange = useCallback((e) => {
    setPriceRange(prev => ({ ...prev, max: e.target.value }))
  }, [])

  const handleNewOnlyChange = useCallback((e) => {
    setShowNewOnly(e.target.checked)
  }, [])

  const handleSortByChange = useCallback((e) => {
    setSortBy(e.target.value)
  }, [])

  return (
    <div className="product-filters">
      <h3>Filtros</h3>

      <div className="filter-group">
        <label>Categoría</label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">Todas</option>
          {categories?.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          )) || null}
        </select>
      </div>

      <div className="filter-group">
        <label>Precio</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Mín"
            value={priceRange.min}
            onChange={handleMinPriceChange}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Máx"
            value={priceRange.max}
            onChange={handleMaxPriceChange}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={showNewOnly}
            onChange={handleNewOnlyChange}
          />
          Solo nuevos
        </label>
      </div>

      <div className="filter-group">
        <label>Ordenar por</label>
        <select value={sortBy} onChange={handleSortByChange}>
          <option value="created_at">Más recientes</option>
          <option value="base_price">Precio: menor a mayor</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
    </div>
  )
}

ProductFilters.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
}

export default ProductFilters
