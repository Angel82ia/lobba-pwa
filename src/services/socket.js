import io from 'socket.io-client'

let socket = null

export const connectSocket = token => {
  if (socket?.connected) {
    return socket
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true,
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinConversation = conversationId => {
  if (socket) {
    socket.emit('join_conversation', conversationId)
  }
}

export const sendMessage = (conversationId, receiverId, content, messageType = 'text') => {
  if (socket) {
    socket.emit('send_message', {
      conversationId,
      receiverId,
      content,
      messageType,
    })
  }
}

export const onMessageReceived = callback => {
  if (socket) {
    socket.on('new_message', callback)
  }
}

export const onTyping = callback => {
  if (socket) {
    socket.on('user_typing', callback)
  }
}

export const emitTyping = conversationId => {
  if (socket) {
    socket.emit('typing', { conversationId })
  }
}

export const getSocket = () => socket
