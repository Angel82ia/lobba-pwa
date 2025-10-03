import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as chatbotController from '../../src/controllers/chatbotController.js'
import * as ChatbotConversation from '../../src/models/ChatbotConversation.js'
import * as ChatbotMessage from '../../src/models/ChatbotMessage.js'
import { generateChatbotResponse } from '../../src/utils/aiService.js'

vi.mock('../../src/models/ChatbotConversation.js')
vi.mock('../../src/models/ChatbotMessage.js')
vi.mock('../../src/utils/aiService.js')

describe('ChatbotController', () => {
  let req, res
  const mockUserId = 'user-123'
  const mockConversationId = 'conv-123'

  beforeEach(() => {
    req = {
      user: { id: mockUserId },
      body: {},
      query: {}
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    beforeEach(() => {
      req.body = { message: 'Hello Olivia' }
      
      vi.mocked(ChatbotConversation.findOrCreateConversation).mockResolvedValue({
        id: mockConversationId,
        user_id: mockUserId
      })
      
      vi.mocked(ChatbotMessage.createMessage)
        .mockResolvedValueOnce({ id: 'user-msg', content: 'Hello Olivia', sender_type: 'user' })
        .mockResolvedValueOnce({ id: 'bot-msg', content: 'Hi there!', sender_type: 'bot' })
      
      vi.mocked(ChatbotMessage.findRecentMessages).mockResolvedValue([])
      vi.mocked(generateChatbotResponse).mockResolvedValue({ response: 'Hi there!' })
      vi.mocked(ChatbotConversation.updateLastMessageTime).mockResolvedValue({})
    })

    it('should send message and return response', async () => {
      await chatbotController.sendMessage(req, res)
      
      expect(ChatbotConversation.findOrCreateConversation).toHaveBeenCalledWith(mockUserId)
      expect(ChatbotMessage.createMessage).toHaveBeenCalledTimes(2)
      expect(generateChatbotResponse).toHaveBeenCalledWith('Hello Olivia', [])
      expect(res.json).toHaveBeenCalledWith({
        userMessage: { id: 'user-msg', content: 'Hello Olivia', sender_type: 'user' },
        botMessage: { id: 'bot-msg', content: 'Hi there!', sender_type: 'bot' },
        conversationId: mockConversationId
      })
    })

    it('should return error for empty message', async () => {
      req.body.message = ''
      
      await chatbotController.sendMessage(req, res)
      
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Mensaje es requerido' })
    })

    it('should handle errors', async () => {
      vi.mocked(ChatbotConversation.findOrCreateConversation).mockRejectedValue(new Error('DB Error'))
      
      await chatbotController.sendMessage(req, res)
      
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'DB Error' })
    })
  })

  describe('getConversation', () => {
    beforeEach(() => {
      vi.mocked(ChatbotConversation.findOrCreateConversation).mockResolvedValue({
        id: mockConversationId,
        user_id: mockUserId
      })
      
      vi.mocked(ChatbotMessage.findMessagesByConversation).mockResolvedValue([
        { id: '1', content: 'Hello', sender_type: 'user' },
        { id: '2', content: 'Hi!', sender_type: 'bot' }
      ])
    })

    it('should return conversation with messages', async () => {
      await chatbotController.getConversation(req, res)
      
      expect(res.json).toHaveBeenCalledWith({
        conversation: { id: mockConversationId, user_id: mockUserId },
        messages: [
          { id: '1', content: 'Hello', sender_type: 'user' },
          { id: '2', content: 'Hi!', sender_type: 'bot' }
        ]
      })
    })

    it('should handle query parameters', async () => {
      req.query = { limit: '10', offset: '5' }
      
      await chatbotController.getConversation(req, res)
      
      expect(ChatbotMessage.findMessagesByConversation).toHaveBeenCalledWith(
        mockConversationId,
        { limit: 10, offset: 5 }
      )
    })
  })

  describe('clearConversation', () => {
    beforeEach(() => {
      vi.mocked(ChatbotConversation.findOrCreateConversation).mockResolvedValue({
        id: mockConversationId
      })
      vi.mocked(ChatbotMessage.deleteConversationMessages).mockResolvedValue([])
    })

    it('should clear conversation messages', async () => {
      await chatbotController.clearConversation(req, res)
      
      expect(ChatbotMessage.deleteConversationMessages).toHaveBeenCalledWith(mockConversationId)
      expect(res.json).toHaveBeenCalledWith({ message: 'Conversación limpiada correctamente' })
    })

    it('should handle errors', async () => {
      vi.mocked(ChatbotMessage.deleteConversationMessages).mockRejectedValue(new Error('Delete Error'))
      
      await chatbotController.clearConversation(req, res)
      
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'Delete Error' })
    })
  })
})
