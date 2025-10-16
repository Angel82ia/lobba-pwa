import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSalonProfile, getSalonServices } from '../../services/profile'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import useStore from '../../store'
import './SalonProfile.css'

const SalonProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useStore()
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isOwner = auth.user?.id === salon?.userId

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchSalon = async () => {
      try {
        setLoading(true)
        const [salonData, servicesData] = await Promise.all([
          getSalonProfile(id, abortController.signal),
          getSalonServices(id, abortController.signal)
        ])
        if (!abortController.signal.aborted) {
          setSalon(salonData)
          setServices(servicesData)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setError(error.message || 'Failed to load salon')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchSalon()
    
    return () => {
      abortController.abort()
    }
  }, [id])

  if (loading) return <div className="loading">Cargando salón...</div>
  if (error) return <div className="error">{error}</div>
  if (!salon) return <div className="not-found">Salón no encontrado</div>

  // Defensive coercion for rating and reviews to avoid runtime errors
  const ratingNum = parseFloat(salon.rating)
  const safeRating = Number.isNaN(ratingNum) ? 0 : ratingNum
  const starsCount = Math.round(safeRating)
  const formattedRating = safeRating.toFixed(1)
  const reviewsCount = Number.isFinite(Number(salon.totalReviews)) ? Number(salon.totalReviews) : 0

  return (
    <div className="salon-profile">
      <div className="salon-gallery">
        {salon.gallery && salon.gallery.length > 0 ? (
          <div className="gallery-grid">
            {salon.gallery.map((image) => (
              <img 
                key={image.id} 
                src={image.cloudinaryUrl} 
                alt={image.title || salon.businessName}
              />
            ))}
          </div>
        ) : (
          <div className="no-gallery">Sin imágenes</div>
        )}
      </div>

      <div className="salon-info-container">
        <div className="salon-main-info">
          <Card>
            <div className="salon-header">
              <h1>{salon.businessName}</h1>
              <div className="salon-rating">
                <span className="rating-stars">{'★'.repeat(starsCount)}</span>
                <span className="rating-value">{formattedRating}</span>
                <span className="rating-count">({reviewsCount} reseñas)</span>
              </div>
            </div>

            {salon.description && (
              <div className="salon-description">
                <p>{salon.description}</p>
              </div>
            )}

            <div className="salon-contact">
              <h3>Contacto</h3>
              <p><strong>Dirección:</strong> {salon.address}, {salon.city}</p>
              {salon.phone && <p><strong>Teléfono:</strong> {salon.phone}</p>}
              {salon.website && <p><strong>Web:</strong> <a href={salon.website} target="_blank" rel="noopener noreferrer">{salon.website}</a></p>}
            </div>

            {salon.businessHours && (
              <div className="salon-hours">
                <h3>Horario</h3>
                {Object.entries(salon.businessHours).map(([day, hours]) => (
                  <div key={day} className="hours-row">
                    <span className="day">{day}</span>
                    <span className="hours">
                      {hours ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {salon.categories && salon.categories.length > 0 && (
              <div className="salon-categories">
                {salon.categories.map((cat) => (
                  <span key={cat.id} className="category-badge">{cat.name}</span>
                ))}
              </div>
            )}

            {isOwner && (
              <div className="owner-actions">
                <Link to={`/salon/${id}/edit`}>
                  <Button>Editar Perfil</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="salon-services">
          <h2>Servicios</h2>
          {services.length > 0 ? (
            <div className="services-list">
              {services.map((service) => (
                <Card key={service.id} className="service-card">
                  <div className="service-header">
                    <h3>{service.name}</h3>
                    {service.discountPercentage > 0 && (
                      <span className="discount-badge">-{service.discountPercentage}%</span>
                    )}
                  </div>
                  {service.description && <p className="service-description">{service.description}</p>}
                  <div className="service-details">
                    <span className="service-duration">{service.durationMinutes} min</span>
                    <span className="service-price">{service.price}€</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => navigate(`/reservations/new/${id}`)}
                  >
                    Reservar
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p>No hay servicios disponibles</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalonProfile
