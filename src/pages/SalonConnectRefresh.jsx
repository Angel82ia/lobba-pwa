import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { refreshStripeConnectLink } from '../services/stripeConnect'
import { Card, Alert, Button } from '../components/common'

const SalonConnectRefresh = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const salonId = searchParams.get('salon_id')

  useEffect(() => {
    const handleRefresh = async () => {
      if (!salonId) {
        setError('ID de salón no encontrado en la URL')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Generar nuevo link de onboarding
        const result = await refreshStripeConnectLink(salonId)
        
        // Redirigir automáticamente al nuevo onboarding
        if (result.success && result.onboardingUrl) {
          window.location.href = result.onboardingUrl
        } else {
          setError('No se pudo generar el link de onboarding')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Error al generar nuevo link de onboarding')
      } finally {
        setLoading(false)
      }
    }

    handleRefresh()
  }, [salonId])

  const handleGoToSettings = () => {
    navigate(`/salon/${salonId}/settings`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card padding="large">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400">Generando nuevo link de configuración...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card padding="large">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">❌</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Error en la Configuración
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Hubo un problema con el proceso de configuración de Stripe.'}
            </p>
            
            <Alert variant="error">
              <strong>Problema detectado:</strong> No se pudo completar la configuración automáticamente.
            </Alert>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleGoToSettings}
              variant="primary"
              fullWidth
            >
              Ir a Configuración del Salón
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Puedes intentar completar la configuración desde el panel de administración
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SalonConnectRefresh
