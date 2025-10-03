import apiClient from './api'

export const generateNailDesign = async (prompt) => {
  const response = await apiClient.post('/ai/generate-nails', { prompt })
  return response.data
}

export const generateHairstyle = async (selfieBase64, styleId) => {
  const response = await apiClient.post('/ai/generate-hairstyle', { selfieBase64, styleId })
  return response.data
}

export const getCatalog = async (type, tags, page = 1, limit = 20) => {
  const params = { type, tags, page, limit }
  const response = await apiClient.get('/ai/catalog', { params })
  return response.data
}

export const getMyDesigns = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/ai/my-designs', { params: { page, limit } })
  return response.data
}

export const getMyFavorites = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/ai/my-favorites', { params: { page, limit } })
  return response.data
}

export const toggleFavorite = async (designId) => {
  const response = await apiClient.patch(`/ai/favorites/${designId}`)
  return response.data
}

export const getQuota = async () => {
  const response = await apiClient.get('/ai/quota')
  return response.data
}

export const requestSpeechRecognition = () => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'))
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'es-ES'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      resolve(transcript)
    }

    recognition.onerror = (event) => {
      reject(new Error(event.error))
    }

    recognition.start()
  })
}
