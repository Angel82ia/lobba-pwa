import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as Message from '../../src/models/Message.js'

describe('Message Model', () => {
  let testUser1
  let testUser2

  beforeEach(async () => {
    await pool.query('DELETE FROM messages')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-message%\'')

    const user1Result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-message-user1@example.com', 'hash', 'Test', 'User1', 'user']
    )
    testUser1 = user1Result.rows[0]

    const user2Result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-message-user2@example.com', 'hash', 'Test', 'User2', 'salon']
    )
    testUser2 = user2Result.rows[0]
  })

  afterEach(async () => {
    await pool.query('DELETE FROM messages')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-message%\'')
  })

  describe('createMessage', () => {
    it('should create a new text message', async () => {
      const message = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Hello!',
        messageType: 'text',
      })

      expect(message).toBeDefined()
      expect(message.sender_id).toBe(testUser1.id)
      expect(message.receiver_id).toBe(testUser2.id)
      expect(message.content).toBe('Hello!')
      expect(message.message_type).toBe('text')
      expect(message.is_read).toBe(false)
      expect(message.conversation_id).toBeDefined()
      expect(message.conversation_id.length).toBe(64)
    })

    it('should create message with attachment', async () => {
      const message = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Check this image',
        messageType: 'image',
        attachmentUrl: 'https://example.com/image.jpg',
      })

      expect(message.message_type).toBe('image')
      expect(message.attachment_url).toBe('https://example.com/image.jpg')
    })
  })

  describe('findMessageById', () => {
    it('should find message by id', async () => {
      const created = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Test message',
        messageType: 'text',
      })

      const found = await Message.findMessageById(created.id)
      expect(found).toBeDefined()
      expect(found.id).toBe(created.id)
    })

    it('should return null for non-existent id', async () => {
      const found = await Message.findMessageById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeNull()
    })
  })

  describe('findMessagesByConversation', () => {
    it('should find all messages in a conversation', async () => {
      const message1 = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Message 1',
        messageType: 'text',
      })

      await Message.createMessage({
        senderId: testUser2.id,
        receiverId: testUser1.id,
        content: 'Message 2',
        messageType: 'text',
      })

      const messages = await Message.findMessagesByConversation(message1.conversation_id)
      expect(messages).toHaveLength(2)
    })

    it('should respect limit and offset', async () => {
      let firstMessageConversationId

      for (let i = 0; i < 5; i++) {
        const msg = await Message.createMessage({
          senderId: testUser1.id,
          receiverId: testUser2.id,
          content: `Message ${i}`,
          messageType: 'text',
        })
        if (i === 0) firstMessageConversationId = msg.conversation_id
      }

      const messages = await Message.findMessagesByConversation(firstMessageConversationId, { limit: 2, offset: 1 })
      expect(messages).toHaveLength(2)
    })
  })

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const message = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Test',
        messageType: 'text',
      })

      const updated = await Message.markAsRead(message.id)
      expect(updated.is_read).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('should count unread messages for a user', async () => {
      await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Message 1',
        messageType: 'text',
      })

      await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Message 2',
        messageType: 'text',
      })

      const count = await Message.getUnreadCount(testUser2.id)
      expect(count).toBe(2)
    })
  })

  describe('findConversations', () => {
    it('should find all conversations for a user', async () => {
      await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Hello',
        messageType: 'text',
      })

      const conversations = await Message.findConversations(testUser1.id)
      expect(conversations.length).toBeGreaterThan(0)
    })
  })
})
