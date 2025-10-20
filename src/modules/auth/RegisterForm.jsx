import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Alert, Card } from '../../components/common'
import { register } from '../../services/auth'
import useStore from '../../store'

const RegisterForm = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    codigo_referido: '',
    codigo_amigas: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { setUser, setToken } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    const ref = searchParams.get('ref')
    const friendCode = searchParams.get('friend')
    
    if (ref) {
      setFormData(prev => ({
        ...prev,
        codigo_referido: ref.toUpperCase(),
      }))
    }
    
    if (friendCode) {
      setFormData(prev => ({
        ...prev,
        codigo_amigas: friendCode.toUpperCase(),
      }))
    }
  }, [searchParams])

  const handleChange = (e) => {
    let value = e.target.value
    
    if (e.target.name === 'codigo_referido' || e.target.name === 'codigo_amigas') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await register(formData)
      setUser(user)
      setToken(localStorage.getItem('accessToken'))
      navigate('/')
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response
        
        switch (status) {
          case 400:
            // Si hay errores de validación específicos, mostrar el primero
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
              setError(data.errors[0].msg)
            } else {
              setError(data.error || 'Datos inválidos. Por favor, verifica los campos.')
            }
            break
            
          case 429:
            setError('Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.')
            break
            
          case 500:
            setError(data.message || 'Error del servidor. Por favor, intenta más tarde.')
            break
            
          default:
            setError('Error al registrarse. Por favor, intenta de nuevo.')
        }
      } else if (err.request) {
        setError('No se pudo conectar al servidor. Verifica tu conexión a internet.')
      } else {
        setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md w-full mx-auto" padding="large">
      <h2 className="font-primary text-2xl font-bold text-[#FF1493] mb-6 text-center">
        Crear Cuenta
      </h2>
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          fullWidth
        />
        
        <Input
          label="Apellido"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          fullWidth
        />
        
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
        />
        
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
          required
          fullWidth
        />
        
        <div>
          <Input
            label="¿Tienes un código de influencer?"
            name="codigo_referido"
            type="text"
            value={formData.codigo_referido}
            onChange={handleChange}
            placeholder="Ej: MARIA10"
            maxLength={20}
            fullWidth
          />
          <p className="text-xs text-gray-500 mt-1">
            Código de influencer (opcional) - 10% de descuento en tu primera compra
          </p>
        </div>
        
        <div>
          <Input
            label="¿Te lo recomendó una amiga?"
            name="codigo_amigas"
            type="text"
            value={formData.codigo_amigas}
            onChange={handleChange}
            placeholder="Ej: ANA2024"
            maxLength={20}
            fullWidth
          />
          <p className="text-xs text-gray-500 mt-1">
            Código de amiga (opcional) - Ambas recibiréis beneficios
          </p>
        </div>
        
        <Button type="submit" loading={loading} fullWidth size="large" className="mt-6">
          Registrarse
        </Button>
      </form>
    </Card>
  )
}

export default RegisterForm
