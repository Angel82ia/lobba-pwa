import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicCatalog } from '../../services/catalog'
import DesignCard from './DesignCard'
import { Card, Button, Select, Alert } from '../../components/common'

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

  const typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'nails', label: '💅 Uñas' },
    { value: 'hairstyle', label: '💇 Peinados' },
  ]

  const sortOptions = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'popular', label: 'Más populares' },
    { value: 'top_rated', label: 'Mejor valorados' },
  ]

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-4xl font-bold text-[#FF1493] mb-8 text-center">
        🎨 Catálogo Público de Diseños
      </h1>
      
      {/* Filters */}
      <Card className="mb-8" padding="medium">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            options={typeOptions}
            fullWidth
          />

          <Select
            label="Ordenar"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            options={sortOptions}
            fullWidth
          />
        </div>
      </Card>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading && page === 1 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando diseños...</p>
          </div>
        </div>
      ) : designs.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No hay diseños disponibles
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map(design => (
              <DesignCard 
                key={design.id} 
                design={design} 
                onClick={() => handleDesignClick(design.id)} 
              />
            ))}
          </div>

          {designs.length > 0 && designs.length % 20 === 0 && (
            <div className="text-center mt-8">
              <Button 
                onClick={() => setPage(p => p + 1)} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CatalogGrid
