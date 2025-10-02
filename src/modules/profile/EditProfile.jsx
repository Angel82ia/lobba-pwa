import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientProfile, updateClientProfile } from '../../services/profile'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import useStore from '../../store'
import './EditProfile.css'

const EditProfile = () => {
  const navigate = useNavigate()
  const { auth } = useStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatar: '',
    bio: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getClientProfile()
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          avatar: data.avatar || '',
          bio: data.bio || '',
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (auth.isAuthenticated) {
      fetchProfile()
    }
  }, [auth.isAuthenticated])

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
      await updateClientProfile(formData)
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="edit-profile">
      <Card>
        <h1>Editar Perfil</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          
          <Input
            label="Apellidos"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          
          <Input
            label="URL del Avatar"
            name="avatar"
            type="url"
            value={formData.avatar}
            onChange={handleChange}
          />
          
          <div className="form-group">
            <label htmlFor="bio">Biografía</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              className="textarea"
            />
          </div>
          
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

export default EditProfile
