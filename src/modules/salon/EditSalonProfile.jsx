import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSalonProfile, updateSalonProfile } from '../../services/profile'
import { Button, Card, Input, Textarea, Alert } from '../../components/common'
import useStore from '../../store'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">
          No autorizado para editar este perfil
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card padding="large">
        <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-6">
          Editar Perfil del Salón
        </h1>
        
        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre del Negocio"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Textarea
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            fullWidth
          />
          
          <Input
            label="Dirección"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Input
            label="Ciudad"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <Input
            label="Código Postal"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            fullWidth
          />
          
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
          />
          
          <Input
            label="Sitio Web"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
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

export default EditSalonProfile
