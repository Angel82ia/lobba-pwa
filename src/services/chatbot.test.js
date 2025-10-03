import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, getConversation, clearConversation } from './chatbot'
import apiClient from './api'

vi.mock('./api')

describe('Chatbot Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send message to chatbot', async () => {
      const mockResponse = {
        data: {
          userMessage: { id: '1', content: 'Hello', sender_type: 'user' },
          botMessage: { id: '2', content: 'Hi there!', sender_type: 'bot' },
          conversationId: 'conv-123'
        }
      }
      
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
      
      const result = await sendMessage('Hello Olivia')
      
      expect(apiClient.post).toHaveBeenCalledWith('/chatbot/message', { message: 'Hello Olivia' })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getConversation', () => {
    it('should get conversation with default params', async () => {
      const mockResponse = {
        data: {
          conversation: { id: 'conv-123' },
          messages: [{ id: '1', content: 'Hello' }]
        }
      }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      const result = await getConversation()
      
      expect(apiClient.get).toHaveBeenCalledWith('/chatbot/conversation', {
        params: { limit: 50, offset: 0 }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should get conversation with custom params', async () => {
      const mockResponse = { data: { messages: [] } }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      await getConversation(20, 10)
      
      expect(apiClient.get).toHaveBeenCalledWith('/chatbot/conversation', {
        params: { limit: 20, offset: 10 }
      })
    })
  })

  describe('clearConversation', () => {
    it('should clear conversation', async () => {
      const mockResponse = {
        data: { message: 'Conversación limpiada correctamente' }
      }
      
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse)
      
      const result = await clearConversation()
      
      expect(apiClient.delete).toHaveBeenCalledWith('/chatbot/conversation')
      expect(result).toEqual(mockResponse.data)
    })
  })
})
