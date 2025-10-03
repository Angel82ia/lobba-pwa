import apiClient from './api'

export const sendMessage = async (message) => {
  const response = await apiClient.post('/chatbot/message', { message })
  return response.data
}

export const getConversation = async (limit = 50, offset = 0) => {
  const response = await apiClient.get('/chatbot/conversation', { 
    params: { limit, offset } 
  })
  return response.data
}

export const clearConversation = async () => {
  const response = await apiClient.delete('/chatbot/conversation')
  return response.data
}
