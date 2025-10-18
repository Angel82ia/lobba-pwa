import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PersonalizedAnimation from '../components/PersonalizedAnimation'
import { preloadUserAnimation } from '../services/animationPreloader'

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

      <style jsx>{`
        .login-success-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%);
          padding: 2rem;
        }

        .success-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .success-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ff69b4;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .animation-wrapper {
          width: 100%;
          max-width: 600px;
        }

        @media (max-width: 640px) {
          .login-success-page {
            padding: 1rem;
          }

          .success-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginSuccess
