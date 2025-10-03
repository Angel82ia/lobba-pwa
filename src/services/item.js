import apiClient from './api'

export const getAllItems = async (page = 1, limit = 50, category = null, isActive = true) => {
  const response = await apiClient.get('/items', {
    params: { page, limit, category, isActive }
  })
  return response.data
}

export const getItemById = async (id) => {
  const response = await apiClient.get(`/items/${id}`)
  return response.data
}

export const checkStock = async (id) => {
  const response = await apiClient.get(`/items/${id}/stock`)
  return response.data
}

export const createItem = async (itemData) => {
  const response = await apiClient.post('/items', itemData)
  return response.data
}

export const updateItem = async (id, updates) => {
  const response = await apiClient.put(`/items/${id}`, updates)
  return response.data
}

export const deleteItem = async (id) => {
  const response = await apiClient.delete(`/items/${id}`)
  return response.data
}

export const updateStock = async (id, quantity) => {
  const response = await apiClient.patch(`/items/${id}/stock`, { quantity })
  return response.data
}
