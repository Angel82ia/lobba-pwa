import apiClient from './api'

export const getActiveBanners = async () => {
  const response = await apiClient.get('/banners/active')
  return response.data
}

export const getAllBanners = async (page = 1, limit = 50) => {
  const response = await apiClient.get('/banners', { params: { page, limit } })
  return response.data
}

export const getBannerById = async (id) => {
  const response = await apiClient.get(`/banners/${id}`)
  return response.data
}

export const createBanner = async (bannerData) => {
  const response = await apiClient.post('/banners', bannerData)
  return response.data
}

export const updateBanner = async (id, updates) => {
  const response = await apiClient.put(`/banners/${id}`, updates)
  return response.data
}

export const deleteBanner = async (id) => {
  const response = await apiClient.delete(`/banners/${id}`)
  return response.data
}

export const toggleBannerActive = async (id) => {
  const response = await apiClient.patch(`/banners/${id}/toggle`)
  return response.data
}
