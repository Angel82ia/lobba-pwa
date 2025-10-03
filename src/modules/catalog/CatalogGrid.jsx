import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicCatalog } from '../../services/catalog'
import DesignCard from './DesignCard'
import Card from '../../components/common/Card'
import './CatalogGrid.css'

const CatalogGrid = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ type: '', sortBy: 'recent' })
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const fetchDesigns = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getPublicCatalog(filters, page, 20)
      
      if (page === 1) {
        setDesigns(data)
      } else {
        setDesigns(prev => [...prev, ...data])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar catálogo')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
    setDesigns([])
  }

  const handleDesignClick = (designId) => {
    navigate(`/catalogo/${designId}`)
  }

  return (
    <div className="catalog-page">
      <Card>
        <h1>Catálogo Público</h1>
        
        <div className="catalog-filters">
          <div className="filter-group">
            <label>Tipo:</label>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="nails">Uñas</option>
              <option value="hairstyle">Peinados</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar:</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="recent">Más recientes</option>
              <option value="popular">Más populares</option>
              <option value="top_rated">Mejor valorados</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && page === 1 ? (
          <div className="loading">Cargando diseños...</div>
        ) : designs.length === 0 ? (
          <div className="empty-state">No hay diseños para mostrar</div>
        ) : (
          <>
            <div className="designs-grid">
              {designs.map(design => (
                <DesignCard 
                  key={design.id} 
                  design={design}
                  onClick={() => handleDesignClick(design.id)}
                />
              ))}
            </div>

            {loading && page > 1 && (
              <div className="loading">Cargando más...</div>
            )}

            {!loading && designs.length >= 20 && (
              <button 
                className="load-more"
                onClick={() => setPage(prev => prev + 1)}
              >
                Cargar más
              </button>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default CatalogGrid
