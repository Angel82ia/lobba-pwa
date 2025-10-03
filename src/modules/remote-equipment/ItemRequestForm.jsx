import { useState } from 'react'
import { getAllItems, checkStock } from '../../services/item'
import { requestItemPermission } from '../../services/permission'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './ItemRequestForm.css'

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

  return (
    <div className="item-request-form">
      <Card>
        <h2>Solicitar Artículo Gratis</h2>
        <p className="description">
          Selecciona un artículo y el dispositivo donde lo quieres recoger
        </p>

        {!items.length && !loading && (
          <Button onClick={fetchItems}>Ver Artículos Disponibles</Button>
        )}

        {error && <div className="error-message">{error}</div>}

        {items.length > 0 && (
          <div className="items-grid">
            {items.map(item => (
              <div
                key={item.id}
                className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleItemSelect(item)}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} />
                )}
                <h3>{item.name}</h3>
                <p className="category">{item.category}</p>
                {item.description && (
                  <p className="description">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <form onSubmit={handleSubmit} className="request-form">
            <h3>Artículo seleccionado: {selectedItem.name}</h3>
            
            <div className="form-group">
              <label htmlFor="deviceId">ID del Dispositivo</label>
              <input
                type="text"
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Escanea o ingresa el ID del dispositivo"
                required
              />
            </div>

            <div className="form-actions">
              <Button type="button" onClick={() => setSelectedItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Solicitando...' : 'Solicitar Permiso'}
              </Button>
            </div>
          </form>
        )}

        {success && (
          <div className="success-message">
            <h3>¡Permiso creado exitosamente!</h3>
            <p>Muestra este código QR en el dispositivo:</p>
            <div className="qr-code">
              <p className="token">{success.token}</p>
            </div>
            <Button onClick={() => setSuccess(null)}>Solicitar Otro</Button>
          </div>
        )}

        {loading && <div className="loading">Cargando...</div>}
      </Card>
    </div>
  )
}

export default ItemRequestForm
