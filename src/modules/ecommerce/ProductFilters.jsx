import { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { getCategories } from '../../services/product'
import { Select } from '../../components/common'

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
        // Error loading categories - non-blocking
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
    }, 500)

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

  const categoryOptions = [
    { value: '', label: 'Todas' },
    ...(categories || []).map(cat => ({ value: cat.id, label: cat.name }))
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Más recientes' },
    { value: 'base_price', label: 'Precio: menor a mayor' },
    { value: 'name', label: 'Nombre A-Z' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        🎛️ Filtros
      </h3>

      <div className="space-y-6">
        {/* Categoría */}
        <div>
          <Select
            label="Categoría"
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={categoryOptions}
            fullWidth
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rango de Precio
          </label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Precio mínimo"
              value={priceRange.min}
              onChange={handleMinPriceChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent text-sm"
            />
            <input
              type="number"
              placeholder="Precio máximo"
              value={priceRange.max}
              onChange={handleMaxPriceChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF1493] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Ordenar por */}
        <div>
          <Select
            label="Ordenar por"
            value={sortBy}
            onChange={handleSortByChange}
            options={sortOptions}
            fullWidth
          />
        </div>

        {/* Solo nuevos */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={showNewOnly}
              onChange={handleNewOnlyChange}
              className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Solo productos nuevos
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}

ProductFilters.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
}

export default ProductFilters
