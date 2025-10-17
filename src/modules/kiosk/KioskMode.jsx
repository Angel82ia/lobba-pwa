import { useState, useEffect } from 'react'
import { validatePermission } from '../../services/permission'
import { createEvent } from '../../services/deviceEvent'
import { Card, Button, Alert } from '../../components/common'

const KioskMode = () => {
  const [token, setToken] = useState('')
  const [permission, setPermission] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [deviceId] = useState(() => {
    return localStorage.getItem('kioskDeviceId') || 'device-unknown'
  })

  useEffect(() => {
    document.body.classList.add('kiosk-mode')
    return () => {
      document.body.classList.remove('kiosk-mode')
    }
  }, [])

  const handleScanToken = async () => {
    if (!token.trim()) {
      setError('Por favor ingresa un token válido')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      const validationResult = await validatePermission(token)

      if (!validationResult.valid) {
        setError('Token inválido o expirado')
        return
      }

      setPermission(validationResult.permission)

      const eventType = validationResult.permission.action_type === 'dispense'
        ? 'dispense_success'
        : validationResult.permission.action_type === 'pickup'
        ? 'pickup_success'
        : 'return_success'

      await createEvent({
        deviceId: deviceId,
        permissionId: validationResult.permission.id,
        eventType: eventType,
        eventData: {
          item_id: validationResult.permission.item_id,
          equipment_id: validationResult.permission.equipment_id
        }
      })

      setSuccess(true)
      setTimeout(() => {
        resetState()
      }, 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al validar el token')
      await createEvent({
        deviceId: deviceId,
        permissionId: null,
        eventType: 'validation_error',
        eventData: { error: err.message }
      })
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setToken('')
    setPermission(null)
    setSuccess(false)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-gray-900 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4">
          🤖 LOBBA Kiosk
        </h1>
        <p className="text-2xl text-white/80 font-mono">
          Dispositivo: {deviceId}
        </p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl" padding="large">
        {!success && !permission && (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Escanea tu código QR
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Acerca tu teléfono al escáner o ingresa el token manualmente
              </p>
            </div>

            {/* Token Input */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Token o código QR"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScanToken()}
                className="w-full px-6 py-4 text-2xl text-center font-mono rounded-xl border-4 border-[#FF1493] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-[#FF1493]/50 transition-all"
                autoFocus
              />
              <Button 
                onClick={handleScanToken} 
                disabled={loading}
                fullWidth
                size="large"
                className="text-xl py-6"
              >
                {loading ? '⏳ Validando...' : '✓ Validar'}
              </Button>
            </div>

            {error && (
              <Alert variant="error" className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-xl mb-4">{error}</p>
                <Button onClick={resetState} variant="outline">
                  Intentar de Nuevo
                </Button>
              </Alert>
            )}
          </div>
        )}

        {success && (
          <div className="text-center space-y-6">
            <div className="text-8xl mb-6 animate-bounce">
              ✅
            </div>
            <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-6">
              ¡Operación Exitosa!
            </h2>
            {permission && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-3 text-left">
                <div className="flex justify-between text-lg">
                  <strong className="text-gray-700 dark:text-gray-300">Acción:</strong>
                  <span className="text-gray-900 dark:text-white font-semibold uppercase">
                    {permission.action_type}
                  </span>
                </div>
                {permission.item_id && (
                  <div className="flex justify-between text-lg">
                    <strong className="text-gray-700 dark:text-gray-300">Artículo:</strong>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {permission.item_id}
                    </span>
                  </div>
                )}
                {permission.equipment_id && (
                  <div className="flex justify-between text-lg">
                    <strong className="text-gray-700 dark:text-gray-300">Equipo:</strong>
                    <span className="text-gray-900 dark:text-white font-mono">
                      {permission.equipment_id}
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
              ⏱️ Se reiniciará automáticamente en 5 segundos...
            </p>
          </div>
        )}
      </Card>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-xl text-white/80">
          ¿Necesitas ayuda? Contacta al personal de LOBBA
        </p>
      </div>
    </div>
  )
}

export default KioskMode
