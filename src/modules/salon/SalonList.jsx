import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAllSalons, getSalonsNearby } from '../../services/salon'
import { Card, Button, Input, Select, Alert } from '../../components/common'
import SalonMap from './SalonMap'
import useGeolocation from '../../hooks/useGeolocation'

const SalonList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ city: '', category: '' })
  const [tempFilters, setTempFilters] = useState({ city: '', category: '' })
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'list')
  const [useNearby, setUseNearby] = useState(false)
  const [radius, setRadius] = useState(5)
  const [tempRadius, setTempRadius] = useState(5)
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const navigate = useNavigate()
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (useNearby && !location && !geoLoading && !geoError && !hasRequestedLocation) {
      requestLocation()
      setHasRequestedLocation(true)
    }
  }, [useNearby, location, geoLoading, geoError, hasRequestedLocation, requestLocation])

  useEffect(() => {
    if (!useNearby) {
      setHasRequestedLocation(false)
    }
  }, [useNearby])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setRadius(tempRadius)
    }, 800)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [tempRadius])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters(tempFilters)
    }, 500)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [tempFilters])

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
    setTempFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    setSearchParams({ view: mode })
  }

  const handleSalonClick = (salonId) => {
    navigate(`/salon/${salonId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando salones...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  return (
    <div className={`max-w-7xl mx-auto py-8 px-4 ${isInitialLoad ? 'opacity-0 animate-fadeIn' : ''}`}>
      {/* Header Card */}
      <Card className="mb-8" padding="large">
        <h1 className="font-primary text-4xl font-bold text-[#FF1493] mb-4 text-center">
          Salones LOBBA
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-lg">
          Encuentra los mejores salones de belleza cerca de ti
        </p>
        
        {/* View Mode Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="medium"
            onClick={() => handleViewModeChange('list')}
          >
            📋 Lista
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            size="medium"
            onClick={() => handleViewModeChange('map')}
          >
            🗺️ Mapa
          </Button>
        </div>

        {/* Location Controls */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={useNearby}
              onChange={(e) => setUseNearby(e.target.checked)}
              disabled={geoLoading || (geoError && !location)}
              className="w-5 h-5 text-[#FF1493] rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#FF1493] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-900 dark:text-white font-medium">
              Buscar cerca de mi ubicación
            </span>
          </label>
          
          {useNearby && location && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Radio: {tempRadius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={tempRadius}
                onChange={(e) => setTempRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF1493]"
              />
            </div>
          )}
          
          {geoError && (
            <p className="text-sm text-[#EF4444] mt-2">
              ⚠️ No se pudo obtener tu ubicación
            </p>
          )}
        </div>
        
        {/* Filters (only when not using nearby) */}
        {!useNearby && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Ciudad"
                placeholder="Buscar por ciudad..."
                value={tempFilters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex-1">
              <Select
                label="Categoría"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                fullWidth
              >
                <option value="">Todas</option>
                <option value="belleza">Belleza</option>
                <option value="peluqueria">Peluquería</option>
                <option value="barberia">Barbería</option>
                <option value="manicura-pedicura">Manicura y Pedicura</option>
                <option value="spa-masajes">Spa y Masajes</option>
                <option value="estetica-avanzada">Estética Avanzada</option>
                <option value="maquillaje">Maquillaje</option>
                <option value="depilacion">Depilación</option>
                <option value="tatuajes-piercings">Tatuajes y Piercings</option>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {salons.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No se encontraron salones
          </p>
        </div>
      ) : (
        <>
          {/* Map View */}
          {viewMode === 'map' && (
            <Card className="p-0 overflow-hidden">
              <SalonMap 
                salons={salons}
                center={location ? [location.latitude, location.longitude] : null}
                onSalonClick={handleSalonClick}
              />
            </Card>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((salon) => (
                <Card 
                  key={salon.id} 
                  hover
                  onClick={() => handleSalonClick(salon.id)}
                  className="cursor-pointer h-full flex flex-col"
                >
                  <h3 className="font-primary text-xl font-semibold text-[#FF1493] mb-2">
                    {salon.businessName}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    📍 {salon.city}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#FF1493] text-lg">
                      {'★'.repeat(Math.round(parseFloat(salon.rating) || 5))}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(parseFloat(salon.rating) || 5).toFixed(1)}
                    </span>
                  </div>
                  
                  {salon.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
                      {salon.description}
                    </p>
                  )}
                  
                  {salon.distance && (
                    <p className="text-sm font-semibold text-[#FF1493] mb-4">
                      📍 {salon.distance} km de distancia
                    </p>
                  )}
                  
                  <Button variant="outline" size="small" fullWidth>
                    Ver Perfil
                  </Button>
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
