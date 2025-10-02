import apiClient from './api'

export const getConversations = async () => {
  const response = await apiClient.get('/messages/conversations')
  return response.data
}

export const getMessages = async (conversationId, options = {}) => {
  const response = await apiClient.get(`/messages/${conversationId}`, { params: options })
  return response.data
}

export const sendMessage = async (receiverId, content, messageType = 'text', attachmentUrl = null) => {
  const response = await apiClient.post('/messages', {
    receiverId,
    content,
    messageType,
    attachmentUrl,
  })
  return response.data
}

export const markAsRead = async (messageId) => {
  const response = await apiClient.put(`/messages/${messageId}/read`)
  return response.data
}
