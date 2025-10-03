import express from 'express'
import * as aiController from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
import { aiGenerationLimiter } from '../middleware/rateLimits.js'

const router = express.Router()

router.post('/generate-nails', requireAuth, aiGenerationLimiter, aiController.generateNails)
router.post('/generate-hairstyle', requireAuth, aiGenerationLimiter, aiController.generateHairstyle)

router.get('/catalog', aiController.getCatalog)
router.get('/my-designs', requireAuth, aiController.getMyDesigns)
router.get('/my-favorites', requireAuth, aiController.getMyFavorites)
router.get('/quota', requireAuth, aiController.getQuota)

router.patch('/favorites/:id', requireAuth, aiController.toggleFavoriteDesign)

export default router
