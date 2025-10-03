import apiClient from './api'

export const registerFCMToken = async (token, deviceType) => {
  const response = await apiClient.post('/notifications/register-token', { token, deviceType })
  return response.data
}

export const getNotificationPreferences = async () => {
  const response = await apiClient.get('/notifications/preferences')
  return response.data
}

export const updateNotificationPreferences = async (preferences) => {
  const response = await apiClient.put('/notifications/preferences', preferences)
  return response.data
}

export const sendNotification = async (notificationData) => {
  const response = await apiClient.post('/notifications/send', notificationData)
  return response.data
}

export const getNotificationHistory = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/notifications/history', { params: { page, limit } })
  return response.data
}

export const getAllNotifications = async (page = 1, limit = 50) => {
  const response = await apiClient.get('/notifications/all', { params: { page, limit } })
  return response.data
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { granted: false, error: 'Notifications not supported' }
  }
  const permission = await Notification.requestPermission()
  return { granted: permission === 'granted', permission }
}
