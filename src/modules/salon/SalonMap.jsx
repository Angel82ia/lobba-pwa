import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import PropTypes from 'prop-types'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})


function SalonMap({ salons, center, zoom = 13, onSalonClick }) {
  const [mapCenter, setMapCenter] = useState(center || [40.416775, -3.703790])

  useEffect(() => {
    if (center) {
      setMapCenter(center)
    } else if (salons && salons.length > 0 && salons[0].location) {
      setMapCenter([salons[0].location.latitude, salons[0].location.longitude])
    }
  }, [center, salons])

  if (!salons || salons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          No hay salones disponibles para mostrar en el mapa
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative">
      <MapContainer 
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
        center={mapCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {salons.map((salon) => {
          if (!salon.location || !salon.location.latitude || !salon.location.longitude) {
            return null
          }
          
          return (
            <Marker 
              key={salon.id} 
              position={[salon.location.latitude, salon.location.longitude]}
              eventHandlers={{
                click: () => {
                  if (onSalonClick) onSalonClick(salon.id)
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-[#FF1493] text-lg mb-2">
                    {salon.businessName}
                  </h3>
                  {salon.description && (
                    <p className="text-sm text-gray-700 mb-2">
                      {salon.description}
                    </p>
                  )}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong className="font-semibold">Dirección:</strong> {salon.address}, {salon.city}
                    </p>
                    {salon.distance && (
                      <p className="text-[#FF1493] font-semibold">
                        📍 {salon.distance} km
                      </p>
                    )}
                    {salon.phone && (
                      <p>
                        <strong className="font-semibold">Teléfono:</strong> {salon.phone}
                      </p>
                    )}
                    {salon.rating && (
                      <p>
                        <strong className="font-semibold">Rating:</strong> ⭐ {salon.rating}/5 ({salon.totalReviews} reseñas)
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

SalonMap.propTypes = {
  salons: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    businessName: PropTypes.string.isRequired,
    description: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    phone: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
    }),
    distance: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalReviews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  })).isRequired,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  onSalonClick: PropTypes.func,
}

export default SalonMap
