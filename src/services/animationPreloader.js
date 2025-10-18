/**
 * Precargar animación de usuario
 * Descarga y cachea las imágenes antes de mostrarlas
 */
export const preloadUserAnimation = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${apiUrl}/api/users/${userId}/animation`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch animation data')
    }

    const data = await response.json()

    if (!data.data.hasCustomAnimation) {
      return false
    }

    const beforeImg = new Image()
    const afterImg = new Image()

    beforeImg.src = data.data.assets.beforeImage
    afterImg.src = data.data.assets.afterImage

    await Promise.all([
      new Promise((resolve, reject) => {
        beforeImg.onload = resolve
        beforeImg.onerror = reject
      }),
      new Promise((resolve, reject) => {
        afterImg.onload = resolve
        afterImg.onerror = reject
      })
    ])

    console.log('✅ Animation preloaded successfully')
    return true

  } catch (error) {
    console.error('❌ Error preloading animation:', error)
    return false
  }
}

/**
 * Precargar thumbnails (más rápido para preview)
 */
export const preloadThumbnails = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const response = await fetch(`${apiUrl}/api/users/${userId}/animation`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch animation data')
    }

    const data = await response.json()

    if (!data.data.hasCustomAnimation) {
      return false
    }

    const beforeThumb = new Image()
    const afterThumb = new Image()

    beforeThumb.src = data.data.assets.beforeThumbnail
    afterThumb.src = data.data.assets.afterThumbnail

    await Promise.all([
      new Promise((resolve) => {
        beforeThumb.onload = resolve
        beforeThumb.onerror = resolve
      }),
      new Promise((resolve) => {
        afterThumb.onload = resolve
        afterThumb.onerror = resolve
      })
    ])

    return true

  } catch (error) {
    console.error('Error preloading thumbnails:', error)
    return false
  }
}
