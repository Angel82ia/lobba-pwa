import * as Message from '../models/Message.js'
import logger from '../utils/logger.js'

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id
    const conversations = await Message.findConversations(userId)
    res.json(conversations)
  } catch (error) {
    logger.error('Get conversations error:', error)
    res.status(500).json({ error: 'Failed to get conversations' })
  }
}

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { limit, offset } = req.query

    const messages = await Message.findMessagesByConversation(conversationId, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    res.json(messages)
  } catch (error) {
    logger.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id
    const { receiverId, content, messageType, attachmentUrl, reservationId } = req.body

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId and content are required' })
    }

    const message = await Message.createMessage({
      senderId,
      receiverId,
      content,
      messageType: messageType || 'text',
      attachmentUrl,
      reservationId,
    })

    if (req.app.get('io')) {
      req.app.get('io').to(message.conversation_id).emit('new_message', message)
    }

    res.status(201).json(message)
  } catch (error) {
    logger.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
}

export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const message = await Message.findMessageById(id)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updated = await Message.markAsRead(id)
    res.json(updated)
  } catch (error) {
    logger.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark message as read' })
  }
}
