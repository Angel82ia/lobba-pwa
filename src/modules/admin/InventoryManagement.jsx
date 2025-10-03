import { useState, useEffect, useCallback } from 'react'
import { getAllItems, createItem, updateItem, deleteItem, updateStock } from '../../services/item'
import { getAllEquipment, createEquipment, updateEquipment, deleteEquipment } from '../../services/equipment'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import useStore from '../../store'
import './InventoryManagement.css'

const InventoryManagement = () => {
  const { auth } = useStore()
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unauthorized, setUnauthorized] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    stockQuantity: 0
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      if (activeTab === 'items') {
        const data = await getAllItems(1, 100)
        setItems(data)
      } else {
        const data = await getAllEquipment(1, 100)
        setEquipment(data)
      }
    } catch (err) {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (auth.user?.role !== 'admin') {
      setUnauthorized(true)
      setLoading(false)
      return
    }
    fetchData()
  }, [auth.user, fetchData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      if (activeTab === 'items') {
        if (editingItem) {
          await updateItem(editingItem.id, formData)
        } else {
          await createItem(formData)
        }
      } else {
        const equipData = {
          ...formData,
          requiresReturn: true
        }
        if (editingItem) {
          await updateEquipment(editingItem.id, equipData)
        } else {
          await createEquipment(equipData)
        }
      }
      resetForm()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) {
      return
    }
    try {
      if (activeTab === 'items') {
        await deleteItem(id)
      } else {
        await deleteEquipment(id)
      }
      fetchData()
    } catch (err) {
      setError('Error al eliminar')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      imageUrl: item.image_url || '',
      stockQuantity: item.stock_quantity || 0
    })
    setShowForm(true)
  }

  const handleStockUpdate = async (itemId, newStock) => {
    try {
      await updateStock(itemId, newStock)
      fetchData()
    } catch (err) {
      setError('Error al actualizar stock')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      imageUrl: '',
      stockQuantity: 0
    })
  }

  if (unauthorized) {
    return <div className="error">No autorizado. Solo administradores pueden acceder.</div>
  }

  if (loading) {
    return <div className="loading">Cargando inventario...</div>
  }

  const currentData = activeTab === 'items' ? items : equipment

  return (
    <div className="inventory-management">
      <h1>Gestión de Inventario</h1>

      <div className="tab-selector">
        <button
          className={activeTab === 'items' ? 'active' : ''}
          onClick={() => setActiveTab('items')}
        >
          Artículos Gratis
        </button>
        <button
          className={activeTab === 'equipment' ? 'active' : ''}
          onClick={() => setActiveTab('equipment')}
        >
          Equipos en Préstamo
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <Card>
        <div className="inventory-header">
          <h2>{activeTab === 'items' ? 'Artículos' : 'Equipos'}</h2>
          <Button onClick={() => setShowForm(true)}>
            + Agregar {activeTab === 'items' ? 'Artículo' : 'Equipo'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="inventory-form">
            <h3>{editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'items' ? 'Artículo' : 'Equipo'}</h3>
            
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="hygiene">Higiene</option>
                <option value="cosmetics">Cosmética</option>
                <option value="hair">Cabello</option>
                <option value="nails">Uñas</option>
                <option value="tools">Herramientas</option>
              </select>
            </div>

            <Input
              label="URL de Imagen"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            />

            {activeTab === 'items' && (
              <Input
                label="Stock Inicial"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value)})}
                min="0"
              />
            )}

            <div className="form-actions">
              <Button type="button" onClick={resetForm}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        )}

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                {activeTab === 'items' && <th>Stock</th>}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  {activeTab === 'items' && (
                    <td>
                      <div className="stock-control">
                        <span>{item.stock_quantity || 0}</span>
                        <input
                          type="number"
                          min="0"
                          defaultValue={item.stock_quantity || 0}
                          onBlur={(e) => handleStockUpdate(item.id, parseInt(e.target.value))}
                          className="stock-input"
                        />
                      </div>
                    </td>
                  )}
                  <td>
                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(item)} className="btn-edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn-delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentData.length === 0 && (
            <div className="empty-state">
              <p>No hay {activeTab === 'items' ? 'artículos' : 'equipos'} registrados</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default InventoryManagement
