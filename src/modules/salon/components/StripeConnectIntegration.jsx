import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { 
  createStripeConnectAccount, 
  getStripeConnectStatus,
  refreshStripeConnectLink 
} from '../../../services/stripeConnect'
import { getSalonProfile } from '../../../services/profile'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import Alert from '../../../components/common/Alert'

const StripeConnectIntegration = ({ salonId }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState(null)
  const [salon, setSalon] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [salonData, statusData] = await Promise.all([
        getSalonProfile(salonId),
        getStripeConnectStatus(salonId),
      ])
      setSalon(salonData)
      setStatus(statusData)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Verificar si volvió de Stripe onboarding
  useEffect(() => {
    if (searchParams.get('stripe_return') === 'true') {
      setSuccess('✅ ¡Configuración de pagos completada! Ya puedes recibir reservas.')
      fetchData()
      // Limpiar query params
      navigate(window.location.pathname, { replace: true })
    }
  }, [searchParams, navigate, fetchData])

  const handleConnectStripe = async () => {
    if (!salon) return

    try {
      setProcessing(true)
      setError(null)

      const result = await createStripeConnectAccount(salonId)

      // Redirigir a Stripe para completar onboarding
      window.location.href = result.onboardingUrl
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con Stripe')
    } finally {
      setProcessing(false)
    }
  }

  const handleRefreshLink = async () => {
    try {
      setProcessing(true)
      setError(null)

      const result = await refreshStripeConnectLink(salonId)
      window.location.href = result.onboardingUrl
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar link')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card padding="large">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-600 dark:text-gray-400">⏳ Cargando configuración de pagos...</p>
        </div>
      </Card>
    )
  }

  // Sin cuenta Stripe Connect
  if (!status?.hasAccount) {
    return (
      <Card padding="large">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#FFE6F5] dark:bg-[#4A1135] rounded-full flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <div className="flex-1">
              <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Configura tus Pagos
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Conecta tu cuenta de Stripe para recibir pagos de las reservas directamente.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          {success && (
            <Alert variant="success">{success}</Alert>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ℹ️ ¿Por qué necesito esto?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Los clientes pagarán al momento de hacer la reserva</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>El dinero se transferirá directamente a tu cuenta bancaria</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Lobba retiene solo un 3% de comisión por transacción</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Proceso seguro gestionado por Stripe</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📋 Requisitos:
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Datos del negocio (CIF/NIF)</li>
              <li>• Cuenta bancaria española (IBAN)</li>
              <li>• Documento de identidad del representante</li>
              <li>• 5-10 minutos para completar el proceso</li>
            </ul>
          </div>

          <Button 
            onClick={handleConnectStripe}
            disabled={processing}
            fullWidth
            size="large"
          >
            {processing ? '⏳ Conectando...' : '🚀 Conectar con Stripe'}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Serás redirigido a Stripe para completar la verificación de forma segura
          </p>
        </div>
      </Card>
    )
  }

  // Cuenta creada pero pendiente de completar onboarding
  if (status.hasAccount && !status.enabled) {
    return (
      <Card padding="large">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Configuración Pendiente
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tu cuenta de Stripe está creada pero necesita completarse para recibir pagos.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          <Alert variant="warning">
            <strong>⚠️ Acción requerida:</strong> Completa la verificación de Stripe para comenzar a recibir pagos.
          </Alert>

          {status.requirements?.currently_due?.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                📝 Información pendiente:
              </h3>
              <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                {status.requirements.currently_due.map((req, idx) => (
                  <li key={idx}>• {req.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cuenta</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {status.hasAccount ? '✓ Creada' : '✗ Pendiente'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verificación</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {status.onboarded ? '✓ Completa' : '⏳ Pendiente'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagos</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {status.enabled ? '✓ Activos' : '✗ Inactivos'}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleRefreshLink}
            disabled={processing}
            fullWidth
            size="large"
          >
            {processing ? '⏳ Generando link...' : '📝 Completar Verificación'}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            El link de verificación es válido por 24 horas
          </p>
        </div>
      </Card>
    )
  }

  // Cuenta completamente configurada
  return (
    <Card padding="large">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div className="flex-1">
            <h2 className="font-primary text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pagos Configurados
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tu cuenta de Stripe está activa y puedes recibir pagos de reservas.
            </p>
          </div>
        </div>

        {success && (
          <Alert variant="success">{success}</Alert>
        )}

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
            ✓ Todo listo para recibir reservas
          </h3>
          <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <p>• Los clientes podrán reservar y pagar al instante</p>
            <p>• Recibirás el 97% del importe (3% comisión Lobba)</p>
            <p>• Transferencias automáticas a tu cuenta bancaria</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cuenta</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">✓</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cobros</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {status.chargesEnabled ? '✓' : '✗'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transferencias</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {status.payoutsEnabled ? '✓' : '✗'}
            </p>
          </div>
        </div>

        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          Cuenta ID: {status.accountId?.slice(0, 20)}...
        </div>
      </div>
    </Card>
  )
}

StripeConnectIntegration.propTypes = {
  salonId: PropTypes.string.isRequired,
}

export default StripeConnectIntegration

