import express from 'express'
import * as referralController from '../controllers/referralController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/code', requireAuth, referralController.getReferralCode)

router.post('/campaign', requireAuth, referralController.createCampaign)

router.post('/register', requireAuth, referralController.registerReferral)

router.post('/complete', requireAuth, referralController.completeReferral)

router.get('/stats', requireAuth, referralController.getStats)

router.get('/history', requireAuth, referralController.getHistory)

export default router
