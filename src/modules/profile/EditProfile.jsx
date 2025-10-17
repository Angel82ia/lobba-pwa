import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClientProfile, updateClientProfile } from '../../services/profile'
import { Button, Card, Input, Textarea, Alert } from '../../components/common'
import useStore from '../../store'

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6">
          Editar Perfil
        </h1>
        
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Input
            label="Apellidos"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Input
            label="URL del Avatar"
            name="avatar"
            type="url"
            value={formData.avatar}
            onChange={handleChange}
            fullWidth
          />
          
          <Textarea
            label="Biografía"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            fullWidth
          />
          
          <div className="flex gap-4 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default EditProfile
