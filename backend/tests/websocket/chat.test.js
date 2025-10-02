import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Server } from 'socket.io'
import { createServer } from 'http'
import Client from 'socket.io-client'
import setupChatHandlers from '../../src/websocket/chat.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ userId: 'test-user-123' })),
  },
}))

vi.mock('../../src/models/Message.js', () => ({
  createMessage: vi.fn(() => Promise.resolve({
    id: 'msg-123',
    conversation_id: 'test-room',
    sender_id: 'test-user-123',
    receiver_id: 'user2',
    content: 'Hello',
    message_type: 'text',
    created_at: new Date(),
  })),
}))

describe('WebSocket Chat', () => {
  let io
  let clientSocket
  let httpServer

  beforeEach(async () => {
    httpServer = createServer()
    io = new Server(httpServer)
    setupChatHandlers(io)
    
    await new Promise((resolve) => {
      httpServer.listen(() => {
        const port = httpServer.address().port
        clientSocket = Client(`http://localhost:${port}`, {
          auth: {
            token: 'test-token',
          },
        })
        
        clientSocket.on('connect', () => {
          resolve()
        })
      })
    })
  })

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect()
    }
    if (io) {
      await new Promise((resolve) => {
        io.close(() => {
          if (httpServer) {
            httpServer.close(() => resolve())
          } else {
            resolve()
          }
        })
      })
    }
  })

  it('should handle connection', () => {
    expect(clientSocket.connected).toBe(true)
  })

  it('should join conversation room', async () => {
    clientSocket.emit('join_conversation', 'test-conversation')
    
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(clientSocket.connected).toBe(true)
  })

  it('should broadcast messages to room', async () => {
    const testMessage = { 
      conversationId: 'test-room',
      content: 'Hello', 
      senderId: 'user1',
      receiverId: 'user2'
    }
    
    const messagePromise = new Promise((resolve) => {
      clientSocket.on('new_message', (message) => {
        resolve(message)
      })
    })

    clientSocket.emit('join_conversation', 'test-room')
    
    await new Promise((resolve) => setTimeout(resolve, 100))
    clientSocket.emit('send_message', testMessage)
    
    const receivedMessage = await messagePromise
    expect(receivedMessage.content).toBe('Hello')
  })
})
