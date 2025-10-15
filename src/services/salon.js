import apiClient from './api'

export const getAllSalons = async (filters = {}) => {
  const params = new URLSearchParams()
  
  if (filters.city) params.append('city', filters.city)
  if (filters.category) params.append('category', filters.category)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  
  const queryString = params.toString()
  const url = queryString ? `/salons?${queryString}` : '/salons'
  
  const response = await apiClient.get(url)
  return response.data
}

export const getSalonById = async (salonId) => {
  const response = await apiClient.get(`/salons/${salonId}`)
  return response.data
}

export const getSalonsNearby = async (latitude, longitude, radius = 5) => {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString()
  })
  
  const response = await apiClient.get(`/salons/nearby?${params.toString()}`)
  return response.data
}

export const getSalonServices = async (salonId) => {
  const response = await apiClient.get(`/salons/${salonId}/services`)
  return response.data
}

export const getSalonCategories = async () => {
  const response = await apiClient.get('/salons/categories')
  return response.data
}
