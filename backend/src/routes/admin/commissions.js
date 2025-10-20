import express from 'express'
import * as commissionsController from '../../controllers/admin/commissionsController.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, requireAdmin, commissionsController.getAllCommissions)
router.get('/stats', requireAuth, requireAdmin, commissionsController.getCommissionStats)
router.put('/:id/pay', requireAuth, requireAdmin, commissionsController.markAsPaid)
router.get('/influencer/:influencerId', requireAuth, requireAdmin, commissionsController.getInfluencerCommissions)

export default router
