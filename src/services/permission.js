import apiClient from './api'

export const requestItemPermission = async (deviceId, itemId) => {
  const response = await apiClient.post('/permissions/item', { deviceId, itemId })
  return response.data
}

export const requestEquipmentPickup = async (deviceId, equipmentId) => {
  const response = await apiClient.post('/permissions/equipment/pickup', { deviceId, equipmentId })
  return response.data
}

export const requestEquipmentReturn = async (deviceId, equipmentId) => {
  const response = await apiClient.post('/permissions/equipment/return', { deviceId, equipmentId })
  return response.data
}

export const validatePermission = async (token) => {
  const response = await apiClient.post('/permissions/validate', { token })
  return response.data
}

export const getUserPermissions = async (status = null) => {
  const response = await apiClient.get('/permissions/user', {
    params: { status }
  })
  return response.data
}

export const getDevicePermissions = async (deviceId, status = null) => {
  const response = await apiClient.get(`/permissions/device/${deviceId}`, {
    params: { status }
  })
  return response.data
}

export const cancelPermission = async (id) => {
  const response = await apiClient.delete(`/permissions/${id}`)
  return response.data
}
