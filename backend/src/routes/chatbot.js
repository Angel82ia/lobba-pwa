import express from 'express'
import * as chatbotController from '../controllers/chatbotController.js'
import { requireAuth } from '../middleware/auth.js'
import { chatbotLimiter } from '../middleware/rateLimits.js'

const router = express.Router()

router.post('/message', requireAuth, chatbotLimiter, chatbotController.sendMessage)
router.get('/conversation', requireAuth, chatbotController.getConversation)
router.delete('/conversation', requireAuth, chatbotController.clearConversation)

export default router
