import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSalonProfile, updateSalonProfile } from '../../services/profile'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import useStore from '../../store'
import './EditSalonProfile.css'

const EditSalonProfile = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { auth } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    website: '',
  })

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getSalonProfile(id, abortController.signal)
        
        if (!abortController.signal.aborted) {
          if (data.userId !== auth.user?.id && auth.user?.role !== 'admin') {
            setUnauthorized(true)
            setLoading(false)
            return
          }

          setFormData({
            businessName: data.businessName || '',
            description: data.description || '',
            address: data.address || '',
            city: data.city || '',
            postalCode: data.postalCode || '',
            phone: data.phone || '',
            website: data.website || '',
          })
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    if (auth.isAuthenticated && id) {
      fetchProfile()
    }
    
    return () => {
      abortController.abort()
    }
  }, [auth.isAuthenticated, auth.user, id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      await updateSalonProfile(id, formData)
      navigate(`/salon/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/salon/${id}`)
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (unauthorized) return <div className="error">No autorizado para editar este perfil</div>

  return (
    <div className="edit-salon-profile">
      <Card>
        <h1>Editar Perfil del Salón</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre del Negocio"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
          />
          
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="textarea"
            />
          </div>
          
          <Input
            label="Dirección"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Ciudad"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Código Postal"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
          />
          
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
          
          <Input
            label="Sitio Web"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
          />
          
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EditSalonProfile
