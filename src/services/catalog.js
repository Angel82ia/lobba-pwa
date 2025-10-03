import apiClient from './api'

export const getPublicCatalog = async (filters = {}, page = 1, limit = 20) => {
  const params = { page, limit, ...filters }
  const response = await apiClient.get('/catalog/public', { params })
  return response.data
}

export const getDesignDetail = async (id) => {
  const response = await apiClient.get(`/catalog/${id}`)
  return response.data
}

export const rateDesign = async (id, rating, comment = '') => {
  const response = await apiClient.post(`/catalog/${id}/rate`, { rating, comment })
  return response.data
}

export const getDesignRatings = async (id, page = 1, limit = 20) => {
  const response = await apiClient.get(`/catalog/${id}/ratings`, { params: { page, limit } })
  return response.data
}

export const shareDesignToPublic = async (generationId) => {
  const response = await apiClient.post(`/catalog/share/${generationId}`)
  return response.data
}
