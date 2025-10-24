import express from 'express'
import * as aiController from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
import { aiGenerationLimiter } from '../middleware/rateLimits.js'
import { checkARCredits } from '../middleware/arCredits.js'

const router = express.Router()

router.post('/generate-nails', requireAuth, checkARCredits('nails', 1), aiGenerationLimiter, aiController.generateNails)
router.post('/generate-hairstyle', requireAuth, checkARCredits('hairstyle', 1), aiGenerationLimiter, aiController.generateHairstyle)
router.post('/generate-makeup', requireAuth, checkARCredits('makeup', 1), aiGenerationLimiter, aiController.generateMakeup)

router.get('/catalog', aiController.getCatalog)
router.get('/my-designs', requireAuth, aiController.getMyDesigns)
router.get('/my-favorites', requireAuth, aiController.getMyFavorites)
router.get('/quota', requireAuth, aiController.getQuota)

router.patch('/favorites/:id', requireAuth, aiController.toggleFavoriteDesign)

export default router
