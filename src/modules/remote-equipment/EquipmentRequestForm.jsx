import { useState, useEffect } from 'react'
import { getAvailableEquipment } from '../../services/equipment'
import { requestEquipmentPickup, requestEquipmentReturn } from '../../services/permission'
import { Card, Button, Input, Alert } from '../../components/common'

const EquipmentRequestForm = () => {
  const [equipment, setEquipment] = useState([])
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [deviceId, setDeviceId] = useState('')
  const [requestType, setRequestType] = useState('pickup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAvailableEquipment()
      setEquipment(data)
    } catch (err) {
      setError('Error al cargar equipos disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedEquipment || !deviceId.trim()) {
      setError('Debes seleccionar un equipo y un dispositivo')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const data = requestType === 'pickup'
        ? await requestEquipmentPickup(deviceId, selectedEquipment.id)
        : await requestEquipmentReturn(deviceId, selectedEquipment.id)
      
      setSuccess(data)
      setSelectedEquipment(null)
      setDeviceId('')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar permiso')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card padding="large" className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
            ¡Permiso creado exitosamente!
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Muestra este código en el dispositivo:
          </p>
          <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 mb-6 border-2 border-dashed border-[#FF1493]">
            <p className="text-3xl font-mono font-bold text-[#FF1493] tracking-wider">
              {success.token}
            </p>
          </div>
          <Button onClick={() => setSuccess(null)} fullWidth>
            Solicitar Otro
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large">
        <h2 className="font-primary text-3xl font-bold text-[#FF1493] mb-4">
          🔋 Solicitar Equipo en Préstamo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Selecciona un equipo y el dispositivo donde lo quieres recoger o devolver
        </p>

        {/* Request Type Selector */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            type="button"
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              requestType === 'pickup'
                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setRequestType('pickup')}
          >
            📥 Recoger Equipo
          </button>
          <button
            type="button"
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              requestType === 'return'
                ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setRequestType('return')}
          >
            📤 Devolver Equipo
          </button>
        </div>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {equipment.length === 0 && !loading && (
          <Card className="text-center" padding="medium">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No hay equipos disponibles en este momento
            </p>
            <Button onClick={fetchEquipment} variant="outline">
              🔄 Recargar
            </Button>
          </Card>
        )}

        {equipment.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {equipment.map(item => (
              <div
                key={item.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  selectedEquipment?.id === item.id
                    ? 'border-[#FF1493] bg-[#FFE6F5] dark:bg-[#4A1135] shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#FF1493] hover:shadow-md'
                }`}
                onClick={() => setSelectedEquipment(item)}
              >
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-xs font-medium text-[#FF1493] uppercase tracking-wider mb-2">
                  {item.category}
                </p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  item.status === 'available'
                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {item.status === 'available' ? '✓ Disponible' : item.status}
                </span>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedEquipment && (
          <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              ⚡ Equipo seleccionado: {selectedEquipment.name}
            </h3>
            
            <Input
              label="ID del Dispositivo"
              id="deviceId"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Escanea o ingresa el ID del dispositivo"
              required
              fullWidth
            />

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setSelectedEquipment(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Solicitando...' : `${requestType === 'pickup' ? '📥 Solicitar Recogida' : '📤 Solicitar Devolución'}`}
              </Button>
            </div>
          </form>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default EquipmentRequestForm
