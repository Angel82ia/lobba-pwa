import express from 'express'
import { authenticateUser } from '../middleware/auth.js'
import { getWhatsAppLinkForSalon, checkSalonWhatsApp } from '../controllers/whatsappController.js'

const router = express.Router()

router.get('/salon/:salonId/link', authenticateUser, getWhatsAppLinkForSalon)

router.get('/salon/:salonId/check', checkSalonWhatsApp)

export default router
