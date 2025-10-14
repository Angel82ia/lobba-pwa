import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { login } from '../services/auth'
import useStore from '../store'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { setUser, setToken } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      setUser(user)
      setToken(localStorage.getItem('accessToken'))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" variant="elevated">
        <h1 className="login-title">Iniciar Sesión</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            fullWidth
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            fullWidth
          />
          <Button type="submit" loading={loading} fullWidth size="large">
            Iniciar Sesión
          </Button>
        </form>
        <div className="login-footer">
          <p>
            ¿No tienes cuenta? <a href="/register">Regístrate</a>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login
