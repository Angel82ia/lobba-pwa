import apiClient from './api'

export const getClientProfile = async (userId) => {
  const endpoint = userId ? `/profile/client/${userId}` : '/profile/client/'
  const response = await apiClient.get(endpoint)
  return response.data
}

export const updateClientProfile = async (profileData) => {
  const response = await apiClient.put('/profile/client', profileData)
  return response.data
}

export const getSalonProfile = async (salonId) => {
  const response = await apiClient.get(`/salon/${salonId}`)
  return response.data
}

export const updateSalonProfile = async (salonId, profileData) => {
  const response = await apiClient.put(`/salon/${salonId}`, profileData)
  return response.data
}

export const getSalonServices = async (salonId) => {
  const response = await apiClient.get(`/salon/${salonId}/services`)
  return response.data
}

export const createSalonService = async (salonId, serviceData) => {
  const response = await apiClient.post(`/salon/${salonId}/services`, serviceData)
  return response.data
}

export const uploadSalonImage = async (salonId, imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await apiClient.post(`/salon/${salonId}/gallery`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const getSalonCategories = async () => {
  const response = await apiClient.get('/salon/categories')
  return response.data
}

export const getAllSalons = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.city) params.append('city', filters.city)
  if (filters.category) params.append('category', filters.category)
  
  const response = await apiClient.get(`/salon?${params.toString()}`)
  return response.data
}
