import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PersonalizedAnimation from '../components/PersonalizedAnimation'
import { preloadUserAnimation } from '../services/animationPreloader'
import './LoginSuccess.css'

const LoginSuccess = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      preloadUserAnimation(user.id)
    }
  }, [user])

  const handleAnimationComplete = () => {
    setTimeout(() => {
      navigate('/dashboard')
    }, 500)
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="login-success-page">
      <div className="success-header">
        <h1 className="success-title">
          ¡Bienvenida, {user.name || user.email}!
        </h1>
      </div>
      
      <div className="animation-wrapper">
        <PersonalizedAnimation
          userId={user.id}
          autoPlay={true}
          onComplete={handleAnimationComplete}
        />
      </div>
    </div>
  )
}

export default LoginSuccess
