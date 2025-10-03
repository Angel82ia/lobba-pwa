import apiClient from './api'

export const getAuditLogs = async (filters = {}) => {
  const response = await apiClient.get('/audit-logs', { params: filters })
  return response.data
}

export const getAuditStats = async (days = 30) => {
  const response = await apiClient.get('/audit-logs/stats', { params: { days } })
  return response.data
}

export const getUserAuditTrail = async (userId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/audit-logs/user/${userId}`, { 
    params: { page, limit } 
  })
  return response.data
}
