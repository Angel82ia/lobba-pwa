import { Server } from 'socket.io'
import setupChatHandlers from './chat.js'

export const initializeWebSocket = httpServer => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173']

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  setupChatHandlers(io)

  return io
}
