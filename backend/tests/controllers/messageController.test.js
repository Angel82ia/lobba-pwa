import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import messageRoutes from '../../src/routes/message.js'
import pool from '../../src/config/database.js'
import { generateToken } from '../../src/utils/auth.js'
import * as Message from '../../src/models/Message.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/messages', messageRoutes)

describe('Message Controller', () => {
  let authToken
  let testUser1
  let testUser2

  beforeEach(async () => {
    await pool.query('DELETE FROM messages')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-message-controller%\'')

    const user1Result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-message-controller-user1@example.com', 'hash', 'Test', 'User1', 'user']
    )
    testUser1 = user1Result.rows[0]
    authToken = generateToken(testUser1)

    const user2Result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-message-controller-user2@example.com', 'hash', 'Test', 'User2', 'salon']
    )
    testUser2 = user2Result.rows[0]
  })

  afterEach(async () => {
    await pool.query('DELETE FROM messages')
    await pool.query('DELETE FROM users WHERE email LIKE \'%test-message-controller%\'')
  })

  describe('GET /api/messages/conversations', () => {
    it('should list user conversations', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await request(app).get('/api/messages/conversations')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/messages/:conversationId', () => {
    it('should get messages in a conversation', async () => {
      const message = await Message.createMessage({
        senderId: testUser1.id,
        receiverId: testUser2.id,
        content: 'Test message',
        messageType: 'text',
      })
      const conversationId = message.conversation_id

      const response = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/messages', () => {
    it('should send a message', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: testUser2.id,
          content: 'Hello!',
          messageType: 'text',
        })

      expect(response.status).toBe(201)
      expect(response.body.content).toBe('Hello!')
    })

    it('should require authentication', async () => {
      const response = await request(app).post('/api/messages').send({})
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/messages/:id/read', () => {
    it('should mark message as read', async () => {
      const message = await Message.createMessage({
        senderId: testUser2.id,
        receiverId: testUser1.id,
        content: 'Test',
        messageType: 'text',
      })

      const response = await request(app)
        .put(`/api/messages/${message.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.is_read).toBe(true)
    })
  })
})
