import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSalons, getSalonsNearby } from '../../services/salon'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import SalonMap from './SalonMap'
import useGeolocation from '../../hooks/useGeolocation'
import './SalonList.css'

const SalonList = () => {
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ city: '', category: '' })
  const [viewMode, setViewMode] = useState('list')
  const [useNearby, setUseNearby] = useState(false)
  const [radius, setRadius] = useState(5)
  const navigate = useNavigate()
  const { location, error: geoError, loading: geoLoading } = useGeolocation()

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchSalons = async () => {
      try {
        setLoading(true)
        setError(null)
        
        let data
        if (useNearby && location) {
          data = await getSalonsNearby(location.latitude, location.longitude, radius, abortController.signal)
          if (!abortController.signal.aborted) {
            setSalons(data.salons || [])
          }
        } else {
          data = await getAllSalons(filters, abortController.signal)
          if (!abortController.signal.aborted) {
            setSalons(data)
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err.message || 'Error al cargar salones')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchSalons()
    
    return () => {
      abortController.abort()
    }
  }, [filters, useNearby, location, radius])

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
        
        <div className="view-controls">
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setViewMode('list')}
          >
            📋 Lista
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setViewMode('map')}
          >
            🗺️ Mapa
          </Button>
        </div>

        <div className="location-controls">
          <label className="location-toggle">
            <input
              type="checkbox"
              checked={useNearby}
              onChange={(e) => setUseNearby(e.target.checked)}
              disabled={geoLoading || geoError}
            />
            <span>Buscar cerca de mi ubicación</span>
          </label>
          
          {useNearby && (
            <div className="radius-control">
              <label>Radio: {radius} km</label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>
          )}
          
          {geoError && (
            <p className="geo-error">⚠️ No se pudo obtener tu ubicación</p>
          )}
        </div>
        
        {!useNearby && (
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
        )}
      </Card>

      {salons.length === 0 ? (
        <div className="empty-state">No se encontraron salones</div>
      ) : (
        <>
          {viewMode === 'map' && (
            <Card className="map-view">
              <SalonMap 
                salons={salons}
                center={location ? [location.latitude, location.longitude] : null}
                onSalonClick={handleSalonClick}
              />
            </Card>
          )}
          
          {viewMode === 'list' && (
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
                  {salon.distance && (
                    <p className="salon-distance">📍 {salon.distance} km</p>
                  )}
                  <Button variant="outline" size="small">Ver Perfil</Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SalonList
