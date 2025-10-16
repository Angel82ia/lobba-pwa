import { describe, it, expect, beforeEach } from 'vitest'
import * as ChatbotConversation from '../../src/models/ChatbotConversation.js'
import pool from '../../src/config/database.js'

describe('ChatbotConversation Model', () => {
  let testUserId

  beforeEach(async () => {
    await pool.query('DELETE FROM chatbot_messages')
    await pool.query('DELETE FROM chatbot_conversations')
    await pool.query("DELETE FROM users WHERE email IN ('chatbot-test@example.com')")

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ('chatbot-test@example.com', 'hash', 'Chatbot', 'Test', 'user')
       RETURNING id`
    )
    testUserId = userResult.rows[0].id
  })

  describe('findOrCreateConversation', () => {
    it('should create new conversation if not exists', async () => {
      const conversation = await ChatbotConversation.findOrCreateConversation(testUserId)

      expect(conversation).toBeTruthy()
      expect(conversation.user_id).toBe(testUserId)
      expect(conversation.id).toBeTruthy()
    })

    it('should return existing conversation if exists', async () => {
      const first = await ChatbotConversation.findOrCreateConversation(testUserId)
      const second = await ChatbotConversation.findOrCreateConversation(testUserId)

      expect(first.id).toBe(second.id)
    })
  })

  describe('findConversationById', () => {
    it('should find conversation by id', async () => {
      const created = await ChatbotConversation.findOrCreateConversation(testUserId)
      const found = await ChatbotConversation.findConversationById(created.id)

      expect(found.id).toBe(created.id)
      expect(found.user_id).toBe(testUserId)
    })

    it('should return undefined for non-existent id', async () => {
      const found = await ChatbotConversation.findConversationById(
        '00000000-0000-0000-0000-000000000000'
      )
      expect(found).toBeUndefined()
    })
  })

  describe('updateLastMessageTime', () => {
    it('should update last message timestamp', async () => {
      const conversation = await ChatbotConversation.findOrCreateConversation(testUserId)
      const originalTime = conversation.last_message_at

      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await ChatbotConversation.updateLastMessageTime(conversation.id)

      expect(new Date(updated.last_message_at)).not.toEqual(new Date(originalTime))
      expect(updated.updated_at).toBeTruthy()
    })
  })

  describe('findUserConversations', () => {
    it('should return user conversations ordered by last message', async () => {
      await ChatbotConversation.findOrCreateConversation(testUserId)

      const conversations = await ChatbotConversation.findUserConversations(testUserId)

      expect(conversations).toHaveLength(1)
      expect(conversations[0].user_id).toBe(testUserId)
    })
  })
})
