import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getStripeConnectStatus } from '../services/stripeConnect'
import { Card, Alert, Button } from '../components/common'

const SalonConnectReturn = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  
  const salonId = searchParams.get('salon_id')

  useEffect(() => {
    const handleReturn = async () => {
      if (!salonId) {
        setError('ID de salón no encontrado en la URL')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Verificar el estado actual de la cuenta Stripe
        const statusData = await getStripeConnectStatus(salonId)
        setStatus(statusData)
        
        // Verificar si la configuración fue exitosa
        if (statusData.success && statusData.enabled && statusData.chargesEnabled && statusData.payoutsEnabled) {
          setSuccess(true)
        } else if (statusData.success && statusData.hasAccount && !statusData.enabled) {
          setError('La configuración está pendiente. Es posible que Stripe necesite más tiempo para procesar la información.')
        } else {
          setError('No se pudo verificar el estado de la configuración.')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Error al verificar el estado de la cuenta Stripe')
      } finally {
        setLoading(false)
      }
    }

    handleReturn()
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
            <p className="text-gray-600 dark:text-gray-400">Verificando configuración de pagos...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card padding="large">
        <div className="text-center space-y-6 max-w-md mx-auto">
          {success ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Configuración Completada!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tu cuenta de Stripe se ha configurado correctamente. Ya puedes recibir pagos de reservas.
                </p>
                <Alert variant="success">
                  <strong>Estado:</strong> Pagos activados y listos para recibir reservas.
                </Alert>
              </div>
              
              {status && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    📋 Estado de la cuenta:
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cobros:</span>
                      <span className={`font-semibold ${status.chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {status.chargesEnabled ? '✓ Activos' : '✗ Inactivos'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Transferencias:</span>
                      <span className={`font-semibold ${status.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {status.payoutsEnabled ? '✓ Activos' : '✗ Inactivos'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleGoToSettings}
                variant="primary"
                fullWidth
                size="large"
              >
                Ir a Configuración del Salón
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Configuración Pendiente
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error || 'La configuración de Stripe aún está en proceso.'}
                </p>
                
                {status && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Estado actual:
                    </h3>
                    <div className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                      <div>• Cuenta: {status.hasAccount ? 'Creada' : 'No creada'}</div>
                      <div>• Verificación: {status.onboarded ? 'Completa' : 'Pendiente'}</div>
                      <div>• Pagos: {status.enabled ? 'Activos' : 'Inactivos'}</div>
                    </div>
                  </div>
                )}

                {status?.requirements?.currently_due?.length > 0 && (
                  <Alert variant="warning">
                    <strong>Información pendiente:</strong> {status.requirements.currently_due.join(', ')}
                  </Alert>
                )}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGoToSettings}
                  variant="secondary"
                  fullWidth
                >
                  Ir a Configuración del Salón
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Puedes completar la configuración desde el panel de administración
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SalonConnectReturn
