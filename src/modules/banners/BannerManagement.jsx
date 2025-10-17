import { useState, useEffect } from 'react'
import { getAllBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive } from '../../services/banner'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import useStore from '../../store'

const BannerManagement = () => {
  const { auth } = useStore()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement',
    imageUrl: '',
    priority: 0,
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (auth.user?.role !== 'admin') {
      setError('No tienes permisos para acceder a esta sección')
      setLoading(false)
      return
    }
    fetchBanners()
  }, [auth.user])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAllBanners()
      setBanners(data)
    } catch (err) {
      setError('Error al cargar banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const bannerData = {
        ...formData,
        imageUrl: formData.imageUrl || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        priority: parseInt(formData.priority) || 0
      }
      
      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData)
      } else {
        await createBanner(bannerData)
      }
      
      setShowForm(false)
      setEditingBanner(null)
      resetForm()
      fetchBanners()
    } catch (err) {
      setError('Error al guardar banner')
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      content: banner.content,
      type: banner.type,
      imageUrl: banner.image_url || '',
      priority: banner.priority,
      startDate: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : '',
      endDate: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que quieres eliminar este banner?')) {
      try {
        await deleteBanner(id)
        fetchBanners()
      } catch (err) {
        setError('Error al eliminar banner')
      }
    }
  }

  const handleToggle = async (id) => {
    try {
      await toggleBannerActive(id)
      fetchBanners()
    } catch (err) {
      setError('Error al cambiar estado del banner')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'announcement',
      imageUrl: '',
      priority: 0,
      startDate: '',
      endDate: ''
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBanner(null)
    resetForm()
  }

  if (auth.user?.role !== 'admin') {
    return (
      <div className="banner-management">
        <div className="error-message">No autorizado. Solo administradores pueden gestionar banners.</div>
      </div>
    )
  }

  if (loading) return <div className="loading">Cargando banners...</div>

  return (
    <div className="banner-management">
      <div className="banner-header">
        <h1>Gestión de Banners</h1>
        <Button onClick={() => setShowForm(true)}>
          Crear Banner
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <Card className="banner-form-card">
          <h2>{editingBanner ? 'Editar Banner' : 'Nuevo Banner'}</h2>
          
          <form onSubmit={handleSubmit} className="banner-form">
            <div className="form-row">
              <Input
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              
              <div className="form-group">
                <label htmlFor="type">Tipo</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="select"
                >
                  <option value="announcement">Anuncio</option>
                  <option value="news">Noticia</option>
                  <option value="promotion">Promoción</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="content">Contenido</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="URL de Imagen (opcional)"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              
              <Input
                label="Prioridad"
                type="number"
                value={String(formData.priority)}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Fecha de Inicio (opcional)"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              
              <Input
                label="Fecha de Fin (opcional)"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingBanner ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="banners-list">
        {banners.length === 0 ? (
          <Card>
            <p className="empty-state">No hay banners creados aún</p>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="banner-item">
              <div className="banner-item-header">
                <div className="banner-item-info">
                  <h3>{banner.title}</h3>
                  <span className={`banner-type badge-${banner.type}`}>
                    {banner.type === 'announcement' ? 'Anuncio' : 
                     banner.type === 'news' ? 'Noticia' : 'Promoción'}
                  </span>
                  <span className={`banner-status ${banner.is_active ? 'active' : 'inactive'}`}>
                    {banner.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="banner-actions">
                  <button 
                    className="toggle-btn"
                    onClick={() => handleToggle(banner.id)}
                    title={banner.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {banner.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(banner)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(banner.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="banner-content">{banner.content}</p>
              
              <div className="banner-meta">
                <span>Prioridad: {banner.priority}</span>
                {banner.start_date && (
                  <span>Desde: {new Date(banner.start_date).toLocaleDateString()}</span>
                )}
                {banner.end_date && (
                  <span>Hasta: {new Date(banner.end_date).toLocaleDateString()}</span>
                )}
                <span>Creado: {new Date(banner.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default BannerManagement
