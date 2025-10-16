import { useState, useEffect } from 'react'
import { getActiveBanners } from '../../services/banner'
import './BannerDisplay.css'

const BannerDisplay = () => {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(new Set())

  // Cargar banners solo una vez al montar
  useEffect(() => {
    let isMounted = true
    
    const fetchBanners = async () => {
      try {
        const data = await getActiveBanners()
        if (isMounted) {
          setBanners(data)
        }
      } catch (err) {
        console.error('Error loading banners:', err)
      }
    }

    fetchBanners()

    return () => {
      isMounted = false
    }
  }, [])

  // Intervalo de rotación independiente
  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  const handleDismiss = (bannerId) => {
    setDismissed(prev => new Set([...prev, bannerId]))
  }

  const visibleBanners = banners.filter(b => !dismissed.has(b.id))
  
  if (visibleBanners.length === 0) {
    return null
  }

  const currentBanner = visibleBanners[currentIndex % visibleBanners.length]
  if (!currentBanner) return null

  return (
    <div className={`banner-display banner-${currentBanner.type}`}>
      <div className="banner-content">
        {currentBanner.image_url && (
          <img 
            src={currentBanner.image_url} 
            alt={currentBanner.title}
            className="banner-image"
          />
        )}
        <div className="banner-text">
          <h3>{currentBanner.title}</h3>
          <p>{currentBanner.content}</p>
        </div>
        <button 
          className="banner-dismiss"
          onClick={() => handleDismiss(currentBanner.id)}
          aria-label="Cerrar banner"
        >
          ✕
        </button>
      </div>
      {visibleBanners.length > 1 && (
        <div className="banner-dots">
          {visibleBanners.map((_, idx) => (
            <span 
              key={idx}
              className={idx === currentIndex % visibleBanners.length ? 'active' : ''}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerDisplay
