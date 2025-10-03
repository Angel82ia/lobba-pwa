import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSalons } from '../../services/profile'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './SalonList.css'

const SalonList = () => {
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ city: '', category: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllSalons(filters)
        setSalons(data)
      } catch (err) {
        setError(err.message || 'Error al cargar salones')
      } finally {
        setLoading(false)
      }
    }

    fetchSalons()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSalonClick = (salonId) => {
    navigate(`/salon/${salonId}`)
  }

  if (loading) return <div className="loading">Cargando salones...</div>
  if (error) return <div className="error-message">{error}</div>

  return (
    <div className="salon-list-page">
      <Card className="salon-list-header">
        <h1>Salones LOBBA</h1>
        <p className="subtitle">Encuentra los mejores salones de belleza cerca de ti</p>
        
        <div className="salon-filters">
          <div className="filter-group">
            <label>Ciudad:</label>
            <input
              type="text"
              placeholder="Buscar por ciudad..."
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Categoría:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="nails">Uñas</option>
              <option value="hair">Peluquería</option>
              <option value="spa">Spa</option>
            </select>
          </div>
        </div>
      </Card>

      {salons.length === 0 ? (
        <div className="empty-state">No se encontraron salones</div>
      ) : (
        <div className="salons-grid">
          {salons.map((salon) => (
            <Card key={salon.id} className="salon-card" onClick={() => handleSalonClick(salon.id)}>
              <h3>{salon.businessName}</h3>
              <p className="salon-city">{salon.city}</p>
              <div className="salon-rating">
                <span className="rating-stars">{'★'.repeat(Math.round(salon.rating || 5))}</span>
                <span className="rating-value">{(salon.rating || 5).toFixed(1)}</span>
              </div>
              {salon.description && (
                <p className="salon-description">{salon.description.substring(0, 100)}...</p>
              )}
              <Button variant="outline" size="small">Ver Perfil</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SalonList
