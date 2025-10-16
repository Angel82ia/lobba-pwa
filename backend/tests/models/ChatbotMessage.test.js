import { describe, it, expect, beforeEach } from 'vitest'
import * as ChatbotMessage from '../../src/models/ChatbotMessage.js'
import * as ChatbotConversation from '../../src/models/ChatbotConversation.js'
import pool from '../../src/config/database.js'

describe('ChatbotMessage Model', () => {
  let testUserId
  let testConversationId

  beforeEach(async () => {
    await pool.query('DELETE FROM chatbot_messages')
    await pool.query('DELETE FROM chatbot_conversations')
    await pool.query("DELETE FROM users WHERE email IN ('chatbot-msg-test@example.com')")
    
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('chatbot-msg-test@example.com', 'hash', 'Chatbot', 'Message', 'user')
       RETURNING id`
    )
    testUserId = userResult.rows[0].id
    
    const conversation = await ChatbotConversation.findOrCreateConversation(testUserId)
    testConversationId = conversation.id
  })

  describe('createMessage', () => {
    it('should create user message', async () => {
      const message = await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'user',
        content: 'Hello Olivia!'
      })
      
      expect(message).toBeTruthy()
      expect(message.conversation_id).toBe(testConversationId)
      expect(message.sender_type).toBe('user')
      expect(message.content).toBe('Hello Olivia!')
    })

    it('should create bot message', async () => {
      const message = await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'bot',
        content: 'Hello! How can I help you?'
      })
      
      expect(message.sender_type).toBe('bot')
      expect(message.content).toBe('Hello! How can I help you?')
    })
  })

  describe('findMessagesByConversation', () => {
    beforeEach(async () => {
      await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'user',
        content: 'First message'
      })
      
      await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'bot',
        content: 'Bot response'
      })
    })

    it('should return messages in chronological order', async () => {
      const messages = await ChatbotMessage.findMessagesByConversation(testConversationId)
      
      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('First message')
      expect(messages[1].content).toBe('Bot response')
    })

    it('should respect limit and offset', async () => {
      const messages = await ChatbotMessage.findMessagesByConversation(
        testConversationId,
        { limit: 1, offset: 0 }
      )
      
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('First message')
    })
  })

  describe('findRecentMessages', () => {
    it('should return recent messages in chronological order', async () => {
      await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'user',
        content: 'Recent message'
      })
      
      const messages = await ChatbotMessage.findRecentMessages(testConversationId, 5)
      
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Recent message')
    })
  })

  describe('deleteConversationMessages', () => {
    it('should delete all messages from conversation', async () => {
      await ChatbotMessage.createMessage({
        conversationId: testConversationId,
        senderType: 'user',
        content: 'To be deleted'
      })
      
      const deleted = await ChatbotMessage.deleteConversationMessages(testConversationId)
      const remaining = await ChatbotMessage.findMessagesByConversation(testConversationId)
      
      expect(deleted).toHaveLength(1)
      expect(remaining).toHaveLength(0)
    })
  })
})
