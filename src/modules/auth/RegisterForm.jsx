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
  const [showPasswordHints, setShowPasswordHints] = useState(false)
  
  const { setUser, setToken } = useStore()
  const navigate = useNavigate()

  // Validación de requisitos de contraseña
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
  }

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
      setError(err.response?.data?.error || 'Error al registrarse. Por favor, verifica los datos.')
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
        onFocus={() => setShowPasswordHints(true)}
        placeholder="Mínimo 8 caracteres"
        required
        fullWidth
      />
      
      {showPasswordHints && (
        <div className="password-requirements">
          <p className="requirements-title">La contraseña debe contener:</p>
          <ul className="requirements-list">
            <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
              {passwordRequirements.minLength ? '✓' : '○'} Al menos 8 caracteres
            </li>
          </ul>
        </div>
      )}
      
      <Button type="submit" loading={loading} fullWidth size="large">
        Registrarse
      </Button>
    </form>
  )
}

export default RegisterForm
