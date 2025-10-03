import { useState, useEffect } from 'react'
import { validatePermission } from '../../services/permission'
import { createEvent } from '../../services/deviceEvent'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './KioskMode.css'

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
    <div className="kiosk-mode">
      <div className="kiosk-header">
        <h1>🤖 LOBBA Kiosk</h1>
        <p className="device-id">Dispositivo: {deviceId}</p>
      </div>

      <Card className="kiosk-card">
        {!success && !permission && (
          <div className="scan-section">
            <h2>Escanea tu código QR</h2>
            <p>Acerca tu teléfono al escáner o ingresa el token manualmente</p>

            <div className="token-input-section">
              <input
                type="text"
                placeholder="Token o código QR"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScanToken()}
                className="token-input"
                autoFocus
              />
              <Button onClick={handleScanToken} disabled={loading}>
                {loading ? 'Validando...' : 'Validar'}
              </Button>
            </div>

            {error && (
              <div className="kiosk-error">
                <span className="error-icon">❌</span>
                <p>{error}</p>
                <Button onClick={resetState}>Intentar de Nuevo</Button>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="success-section">
            <span className="success-icon">✅</span>
            <h2>¡Operación Exitosa!</h2>
            {permission && (
              <div className="permission-details">
                <p>
                  <strong>Acción:</strong> {permission.action_type}
                </p>
                {permission.item_id && (
                  <p>
                    <strong>Artículo:</strong> {permission.item_id}
                  </p>
                )}
                {permission.equipment_id && (
                  <p>
                    <strong>Equipo:</strong> {permission.equipment_id}
                  </p>
                )}
              </div>
            )}
            <p className="auto-reset">Se reiniciará automáticamente...</p>
          </div>
        )}
      </Card>

      <div className="kiosk-footer">
        <p>¿Necesitas ayuda? Contacta al personal de LOBBA</p>
      </div>
    </div>
  )
}

export default KioskMode
