import { Server } from 'socket.io'
import setupChatHandlers from './chat.js'

export const initializeWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  setupChatHandlers(io)

  return io
}
