import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { register } from '../services/auth'
import useStore from '../store'
import './Register.css'

const Register = () => {
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
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <Card className="register-card" variant="elevated">
        <h1 className="register-title">Crear Cuenta</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <Input
            label="Nombre"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            fullWidth
          />
          
          <Input
            label="Apellido"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Tu apellido"
            required
            fullWidth
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            fullWidth
          />
          
          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            fullWidth
          />
          
          <Button type="submit" loading={loading} fullWidth size="large">
            Registrarse
          </Button>
        </form>
        
        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Register

