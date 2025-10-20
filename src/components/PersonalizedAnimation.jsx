import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './PersonalizedAnimation.css'

const PersonalizedAnimation = ({ userId, autoPlay = true, onComplete }) => {
  const [animationData, setAnimationData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const containerRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    loadAnimation()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [userId])

  const loadAnimation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}/animation`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('No se pudo cargar la animación')
      }

      const data = await response.json()
      setAnimationData(data.data)

      if (autoPlay && data.data.hasCustomAnimation) {
        setTimeout(() => {
          startAnimation(data.data)
        }, 100)
      }
    } catch (err) {
      console.error('Error loading animation:', err)
      setError(err.message)
      loadDefaultAnimation()
    } finally {
      setIsLoading(false)
    }
  }

  const startAnimation = (data) => {
    const duration = data.animationDuration || 2500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      setAnimationProgress(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        if (onComplete) {
          onComplete()
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const loadDefaultAnimation = () => {
    setAnimationData({
      hasCustomAnimation: false,
      assets: {
        beforeImage: '/default-before.jpg',
        afterImage: '/default-after.jpg'
      }
    })
  }

  if (isLoading) {
    return (
      <div className="animation-loading">
        <div className="spinner"></div>
        <p className="loading-text">Cargando tu animación...</p>
      </div>
    )
  }

  if (!animationData?.hasCustomAnimation) {
    return <DefaultAnimation />
  }

  return (
    <div className="personalized-animation" ref={containerRef}>
      <div className="animation-container">
        <img
          src={animationData.assets.beforeImage}
          alt="Before"
          className="animation-image animation-before"
          style={{ opacity: 1 - animationProgress }}
        />
        <img
          src={animationData.assets.afterImage}
          alt="After"
          className="animation-image animation-after"
          style={{ opacity: animationProgress }}
        />
      </div>
    </div>
  )
}

const DefaultAnimation = () => {
  return (
    <div className="personalized-animation default-animation">
      <div className="animation-container">
        <div className="default-content">
          <div className="makeup-icon">💄</div>
          <h3>¡Bienvenida a LOBBA!</h3>
          <p>Sube tus fotos para crear tu animación personalizada</p>
        </div>
      </div>
    </div>
  )
}

PersonalizedAnimation.propTypes = {
  userId: PropTypes.string.isRequired,
  autoPlay: PropTypes.bool,
  onComplete: PropTypes.func
}

export default PersonalizedAnimation
