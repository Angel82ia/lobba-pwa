import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getConversations, getMessages, sendMessage, markMessageAsRead } from '../controllers/messageController.js'

const router = express.Router()

router.get('/conversations', authenticate, getConversations)
router.get('/:conversationId', authenticate, getMessages)
router.post('/', authenticate, sendMessage)
router.put('/:id/read', authenticate, markMessageAsRead)

export default router
