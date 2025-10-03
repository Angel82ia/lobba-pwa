import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getCategories } from '../../services/product'
import './ProductFilters.css'

const ProductFilters = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('created_at')
  const [showNewOnly, setShowNewOnly] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch {
        // Error silently ignored
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const filters = {
      ...(selectedCategory && { categoryId: selectedCategory }),
      ...(priceRange.min && { minPrice: priceRange.min }),
      ...(priceRange.max && { maxPrice: priceRange.max }),
      ...(showNewOnly && { isNew: 'true' }),
      sortBy,
    }

    onFilterChange(filters)
  }, [selectedCategory, priceRange, sortBy, showNewOnly, onFilterChange])

  return (
    <div className="product-filters">
      <h3>Filtros</h3>

      <div className="filter-group">
        <label>Categoría</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Precio</label>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Mín"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Máx"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={showNewOnly}
            onChange={(e) => setShowNewOnly(e.target.checked)}
          />
          Solo nuevos
        </label>
      </div>

      <div className="filter-group">
        <label>Ordenar por</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
