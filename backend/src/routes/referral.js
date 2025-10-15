import express from 'express'
import * as referralController from '../controllers/referralController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/code', authenticateToken, referralController.getReferralCode)

router.post('/campaign', authenticateToken, referralController.createCampaign)

router.post('/register', authenticateToken, referralController.registerReferral)

router.post('/complete', authenticateToken, referralController.completeReferral)

router.get('/stats', authenticateToken, referralController.getStats)

router.get('/history', authenticateToken, referralController.getHistory)

export default router
