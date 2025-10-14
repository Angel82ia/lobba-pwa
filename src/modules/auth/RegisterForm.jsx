import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { register } from '../../services/auth'
import useStore from '../../store'
import './RegisterForm.css'

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { setUser, setToken } = useStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Crear Cuenta</h2>
      
      {error && <div className="error-message">{error}</div>}
      
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
      
      <Button type="submit" loading={loading} fullWidth size="large">
        Registrarse
      </Button>
    </form>
  )
}

export default RegisterForm
