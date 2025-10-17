import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Alert, Card } from '../../components/common'
import { login } from '../../services/auth'
import useStore from '../../store'

const LoginForm = () => {
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
      if (err.response) {
        const { status, data } = err.response
        
        switch (status) {
          case 400:
            // Si hay errores de validación específicos, mostrar el primero
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
              setError(data.errors[0].msg)
            } else {
              setError(data.error || 'Datos inválidos')
            }
            break
            
          case 401:
            setError(data.message || data.error || 'Email o contraseña incorrectos')
            break
            
          case 429:
            setError('Demasiados intentos. Por favor, espera unos minutos e intenta de nuevo.')
            break
            
          case 500:
            setError(data.message || 'Error del servidor. Por favor, intenta más tarde.')
            break
            
          default:
            setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
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
        Iniciar Sesión
      </h2>
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <Button type="submit" loading={loading} fullWidth size="large" className="mt-6">
          Iniciar Sesión
        </Button>
      </form>
    </Card>
  )
}

export default LoginForm
