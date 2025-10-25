import * as ChatbotConversation from '../models/ChatbotConversation.js'
import * as ChatbotMessage from '../models/ChatbotMessage.js'
import { generateChatbotResponse } from '../utils/aiService.js'
import logger from '../utils/logger.js'

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body
    const userId = req.user.id

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensaje es requerido' })
    }

    const conversation = await ChatbotConversation.findOrCreateConversation(userId)

    const userMessage = await ChatbotMessage.createMessage({
      conversationId: conversation.id,
      senderType: 'user',
      content: message
    })

    const history = await ChatbotMessage.findRecentMessages(conversation.id, 10)

    const aiResult = await generateChatbotResponse(message, history, userId)

    const botMessage = await ChatbotMessage.createMessage({
      conversationId: conversation.id,
      senderType: 'bot',
      content: aiResult.response
    })

    await ChatbotConversation.updateLastMessageTime(conversation.id)

    res.json({
      userMessage,
      botMessage,
      conversationId: conversation.id
    })
  } catch (error) {
    logger.error('Chatbot send message error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getConversation = async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 50, offset = 0 } = req.query

    const conversation = await ChatbotConversation.findOrCreateConversation(userId)
    const messages = await ChatbotMessage.findMessagesByConversation(
      conversation.id,
      { limit: parseInt(limit), offset: parseInt(offset) }
    )

    res.json({
      conversation,
      messages
    })
  } catch (error) {
    logger.error('Get chatbot conversation error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const clearConversation = async (req, res) => {
  try {
    const userId = req.user.id

    const conversation = await ChatbotConversation.findOrCreateConversation(userId)
    await ChatbotMessage.deleteConversationMessages(conversation.id)

    res.json({ message: 'Conversación limpiada correctamente' })
  } catch (error) {
    logger.error('Clear chatbot conversation error:', error)
    res.status(500).json({ message: error.message })
  }
}
