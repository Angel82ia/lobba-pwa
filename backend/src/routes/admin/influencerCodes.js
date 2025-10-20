import express from 'express'
import * as influencerCodesController from '../../controllers/admin/influencerCodesController.js'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, requireAdmin, influencerCodesController.getAllCodes)
router.post('/', requireAuth, requireAdmin, influencerCodesController.createCode)
router.put('/:id', requireAuth, requireAdmin, influencerCodesController.updateCode)
router.delete('/:id', requireAuth, requireAdmin, influencerCodesController.deleteCode)
router.get('/stats', requireAuth, requireAdmin, influencerCodesController.getCodeStats)
router.get('/:id/usage', requireAuth, requireAdmin, influencerCodesController.getCodeUsage)

export default router
