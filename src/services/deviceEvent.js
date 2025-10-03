import apiClient from './api'

export const createEvent = async (eventData) => {
  const response = await apiClient.post('/device-events', eventData)
  return response.data
}

export const getDeviceEvents = async (deviceId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/device-events/device/${deviceId}`, {
    params: { page, limit }
  })
  return response.data
}

export const getUserEvents = async (page = 1, limit = 50) => {
  const response = await apiClient.get('/device-events/user', {
    params: { page, limit }
  })
  return response.data
}

export const getEventsByPermission = async (permissionId) => {
  const response = await apiClient.get(`/device-events/permission/${permissionId}`)
  return response.data
}

export const getRecentErrors = async (hours = 24, limit = 50) => {
  const response = await apiClient.get('/device-events/errors', {
    params: { hours, limit }
  })
  return response.data
}

export const getDeviceStats = async (deviceId, days = 7) => {
  const response = await apiClient.get(`/device-events/device/${deviceId}/stats`, {
    params: { days }
  })
  return response.data
}
