import apiClient from './api'

export const getAllEquipment = async (page = 1, limit = 50, status = null, category = null, isActive = true) => {
  const response = await apiClient.get('/equipment', {
    params: { page, limit, status, category, isActive }
  })
  return response.data
}

export const getAvailableEquipment = async (category = null) => {
  const response = await apiClient.get('/equipment/available', {
    params: { category }
  })
  return response.data
}

export const getEquipmentById = async (id) => {
  const response = await apiClient.get(`/equipment/${id}`)
  return response.data
}

export const createEquipment = async (equipmentData) => {
  const response = await apiClient.post('/equipment', equipmentData)
  return response.data
}

export const updateEquipment = async (id, updates) => {
  const response = await apiClient.put(`/equipment/${id}`, updates)
  return response.data
}

export const deleteEquipment = async (id) => {
  const response = await apiClient.delete(`/equipment/${id}`)
  return response.data
}

export const updateEquipmentStatus = async (id, status) => {
  const response = await apiClient.patch(`/equipment/${id}/status`, { status })
  return response.data
}

export const updateEquipmentLocation = async (id, locationId) => {
  const response = await apiClient.patch(`/equipment/${id}/location`, { locationId })
  return response.data
}
