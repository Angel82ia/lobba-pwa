import apiClient from './api'

export const getClientProfile = async userId => {
  const endpoint = userId ? `/profile/client/${userId}` : '/profile/client/'
  const response = await apiClient.get(endpoint)
  return response.data
}

export const updateClientProfile = async profileData => {
  const response = await apiClient.put('/profile/client', profileData)
  return response.data
}

export const getSalonProfile = async (salonId, signal = null) => {
  const response = await apiClient.get(`/salons/${salonId}`, { signal })
  return response.data
}

export const updateSalonProfile = async (salonId, profileData) => {
  const response = await apiClient.put(`/salons/${salonId}`, profileData)
  return response.data
}

export const getSalonServices = async (salonId, signal = null) => {
  const response = await apiClient.get(`/salons/${salonId}/services`, { signal })
  return response.data
}

export const createSalonService = async (salonId, serviceData) => {
  const response = await apiClient.post(`/salons/${salonId}/services`, serviceData)
  return response.data
}

export const uploadSalonImage = async (salonId, imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await apiClient.post(`/salons/${salonId}/gallery`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getSalonCategories = async () => {
  const response = await apiClient.get('/salons/categories')
  return response.data
}

export const getAllSalons = async (filters = {}, signal = null) => {
  const params = new URLSearchParams()
  if (filters.city) params.append('city', filters.city)
  if (filters.category) params.append('category', filters.category)

  const response = await apiClient.get(`/salons?${params.toString()}`, { signal })
  return response.data
}
