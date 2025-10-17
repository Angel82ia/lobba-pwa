import { useState, useEffect } from 'react'
import { getActiveBanners } from '../../services/banner'

const BannerDisplay = () => {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    let isMounted = true
    
    const fetchBanners = async () => {
      try {
        const data = await getActiveBanners()
        if (isMounted) {
          setBanners(data)
        }
        } catch (err) {
          // Error loading banners - fail silently
        }
    }

    fetchBanners()

    return () => {
      isMounted = false
    }
  }, [])

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

  const bannerColors = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    promo: 'bg-[#FFE6F5] dark:bg-[#4A1034] border-[#FF1493] dark:border-[#C71585]',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    alert: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  }

  const bannerTextColors = {
    info: 'text-blue-900 dark:text-blue-100',
    promo: 'text-[#C71585] dark:text-[#FF69B4]',
    warning: 'text-yellow-900 dark:text-yellow-100',
    alert: 'text-red-900 dark:text-red-100',
  }

  return (
    <div className={`relative ${bannerColors[currentBanner.type] || bannerColors.info} border-b-2 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {currentBanner.image_url && (
          <img 
            src={currentBanner.image_url} 
            alt={currentBanner.title}
            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm md:text-base ${bannerTextColors[currentBanner.type] || bannerTextColors.info}`}>
            {currentBanner.title}
          </h3>
          <p className={`text-xs md:text-sm ${bannerTextColors[currentBanner.type] || bannerTextColors.info} opacity-90`}>
            {currentBanner.content}
          </p>
        </div>
        <button 
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${bannerTextColors[currentBanner.type] || bannerTextColors.info}`}
          onClick={() => handleDismiss(currentBanner.id)}
          aria-label="Cerrar banner"
        >
          ✕
        </button>
      </div>
      {visibleBanners.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
          {visibleBanners.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex % visibleBanners.length 
                  ? 'bg-[#FF1493] w-6' 
                  : 'bg-gray-400 dark:bg-gray-600'
              }`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ver banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerDisplay
