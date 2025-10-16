import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import PropTypes from 'prop-types'
import './SalonMap.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Note: We avoid useMap() to reduce context issues; we re-key MapContainer instead

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
      <div className="salon-map-empty">
        <p>No hay salones disponibles para mostrar en el mapa</p>
      </div>
    )
  }

  return (
    <div className="salon-map-container">
      <MapContainer 
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
        center={mapCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
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
                <div className="salon-map-popup">
                  <h3>{salon.businessName}</h3>
                  {salon.description && <p>{salon.description}</p>}
                  <p className="salon-map-address">
                    <strong>Dirección:</strong> {salon.address}, {salon.city}
                  </p>
                  {salon.distance && (
                    <p className="salon-map-distance">
                      <strong>Distancia:</strong> {salon.distance} km
                    </p>
                  )}
                  {salon.phone && (
                    <p className="salon-map-phone">
                      <strong>Teléfono:</strong> {salon.phone}
                    </p>
                  )}
                  {salon.rating && (
                    <p className="salon-map-rating">
                      <strong>Rating:</strong> ⭐ {salon.rating}/5 ({salon.totalReviews} reseñas)
                    </p>
                  )}
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
