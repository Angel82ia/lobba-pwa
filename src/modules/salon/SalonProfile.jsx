import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getSalonProfile, getSalonServices } from '../../services/profile'
import { Button, Card, Alert } from '../../components/common'
import useStore from '../../store'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando salón...</p>
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

  if (!salon) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="info">Salón no encontrado</Alert>
      </div>
    )
  }

  const ratingNum = parseFloat(salon.rating)
  const safeRating = Number.isNaN(ratingNum) ? 0 : ratingNum
  const starsCount = Math.round(safeRating)
  const formattedRating = safeRating.toFixed(1)
  const reviewsCount = Number.isFinite(Number(salon.totalReviews)) ? Number(salon.totalReviews) : 0

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Gallery */}
      {salon.gallery && salon.gallery.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {salon.gallery.map((image) => (
              <img 
                key={image.id} 
                src={image.cloudinaryUrl} 
                alt={image.title || salon.businessName}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-6">
              <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-3">
                {salon.businessName}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[#FF1493] text-2xl">
                  {'★'.repeat(starsCount)}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formattedRating}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  ({reviewsCount} reseñas)
                </span>
              </div>
            </div>

            {salon.description && (
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {salon.description}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Contacto
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-gray-900 dark:text-white">Dirección:</strong>{' '}
                  {salon.address}, {salon.city}
                </p>
                {salon.phone && (
                  <p>
                    <strong className="text-gray-900 dark:text-white">Teléfono:</strong>{' '}
                    <a href={`tel:${salon.phone}`} className="text-[#FF1493] hover:underline">
                      {salon.phone}
                    </a>
                  </p>
                )}
                {salon.website && (
                  <p>
                    <strong className="text-gray-900 dark:text-white">Web:</strong>{' '}
                    <a 
                      href={salon.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#FF1493] hover:underline"
                    >
                      {salon.website}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Business Hours */}
            {salon.businessHours && (
              <div className="mb-6">
                <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Horario
                </h3>
                <div className="space-y-2">
                  {Object.entries(salon.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span className="font-medium capitalize">{day}</span>
                      <span>
                        {hours ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {salon.categories && salon.categories.length > 0 && (
              <div>
                <h3 className="font-primary text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Categorías
                </h3>
                <div className="flex flex-wrap gap-2">
                  {salon.categories.map((category, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-[#FFE6F5] text-[#C71585] rounded-full text-sm font-medium"
                    >
                      {typeof category === 'string' ? category : category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Services */}
          {services.length > 0 && (
            <Card>
              <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Servicios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#FF1493] transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[#FF1493] font-bold">
                        {service.price}€
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            {isOwner ? (
              <div className="space-y-3">
                <Link to={`/salon/${id}/edit`}>
                  <Button fullWidth>Editar Perfil</Button>
                </Link>
                <Button 
                  fullWidth
                  variant="outline"
                  onClick={() => navigate('/salon/services')}
                >
                  Gestionar Servicios
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  fullWidth
                  onClick={() => navigate(`/salon/${id}/reserve`)}
                >
                  Reservar Cita
                </Button>
                <Button fullWidth variant="outline">
                  Ver Reseñas
                </Button>
              </div>
            )}
          </Card>

          {/* Location Card */}
          {salon.location && (
            <Card>
              <h3 className="font-primary text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Ubicación
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {salon.address}, {salon.city}
              </p>
              <Button fullWidth variant="outline" size="small">
                Ver en Mapa
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalonProfile
