import { useState } from 'react'
import { getAllItems, checkStock } from '../../services/item'
import { requestItemPermission } from '../../services/permission'
import { Card, Button, Input, Alert } from '../../components/common'

const ItemRequestForm = () => {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAllItems(1, 50, null, true)
      setItems(data)
    } catch (err) {
      setError('Error al cargar artículos disponibles')
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = async (item) => {
    setSelectedItem(item)
    try {
      const stockData = await checkStock(item.id)
      if (stockData.stock <= 0) {
        setError('Este artículo no tiene stock disponible')
      }
    } catch (err) {
      setError('Error al verificar stock')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || !deviceId.trim()) {
      setError('Debes seleccionar un artículo y un dispositivo')
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await requestItemPermission(deviceId, selectedItem.id)
      setSuccess(data)
      setSelectedItem(null)
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
            Solicitar Otro Artículo
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card padding="large">
        <h2 className="font-primary text-3xl font-bold text-[#FF1493] mb-4">
          🎁 Solicitar Artículo Gratis
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Selecciona un artículo y el dispositivo donde lo quieres recoger
        </p>

        {!items.length && !loading && (
          <div className="text-center py-8">
            <Button onClick={fetchItems} size="large">
              Ver Artículos Disponibles
            </Button>
          </div>
        )}

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {items.map(item => (
              <div
                key={item.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                  selectedItem?.id === item.id
                    ? 'border-[#FF1493] bg-[#FFE6F5] dark:bg-[#4A1135] shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#FF1493] hover:shadow-md'
                }`}
                onClick={() => handleItemSelect(item)}
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
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              📦 Artículo seleccionado: {selectedItem.name}
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
              <Button type="button" variant="outline" onClick={() => setSelectedItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Solicitando...' : 'Solicitar Permiso'}
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

export default ItemRequestForm
