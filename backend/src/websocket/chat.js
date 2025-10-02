import jwt from 'jsonwebtoken'
import * as Message from '../models/Message.js'

const setupChatHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.userId
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`)

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId)
      console.log(`User ${socket.userId} joined conversation ${conversationId}`)
    })

    socket.on('send_message', async (data) => {
      try {
        const { conversationId, receiverId, content, messageType } = data

        const message = await Message.createMessage({
          conversationId,
          senderId: socket.userId,
          receiverId,
          content,
          messageType: messageType || 'text',
        })

        io.to(conversationId).emit('new_message', message)
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('typing', (data) => {
      const { conversationId } = data
      socket.to(conversationId).emit('user_typing', { userId: socket.userId })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })
}

export default setupChatHandlers
