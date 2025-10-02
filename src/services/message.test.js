import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as messageService from './message'
import apiClient from './api'

vi.mock('./api')

describe('Message Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should fetch conversations', async () => {
      const mockConversations = [{ conversation_id: '123' }]
      apiClient.get.mockResolvedValue({ data: mockConversations })

      const conversations = await messageService.getConversations()

      expect(apiClient.get).toHaveBeenCalledWith('/messages/conversations')
      expect(conversations).toEqual(mockConversations)
    })
  })

  describe('getMessages', () => {
    it('should fetch messages for a conversation', async () => {
      const mockMessages = [{ id: '1', content: 'Hello' }]
      apiClient.get.mockResolvedValue({ data: mockMessages })

      const messages = await messageService.getMessages('conversation-123')

      expect(apiClient.get).toHaveBeenCalledWith('/messages/conversation-123', { params: {} })
      expect(messages).toEqual(mockMessages)
    })
  })

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const mockMessage = { id: '123', content: 'Hello' }
      apiClient.post.mockResolvedValue({ data: mockMessage })

      const message = await messageService.sendMessage('receiver-123', 'Hello')

      expect(apiClient.post).toHaveBeenCalledWith('/messages', {
        receiverId: 'receiver-123',
        content: 'Hello',
        messageType: 'text',
      })
      expect(message).toEqual(mockMessage)
    })
  })

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const mockMessage = { id: '123', is_read: true }
      apiClient.put.mockResolvedValue({ data: mockMessage })

      const message = await messageService.markAsRead('123')

      expect(apiClient.put).toHaveBeenCalledWith('/messages/123/read')
      expect(message).toEqual(mockMessage)
    })
  })
})
