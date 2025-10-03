import express from 'express'
import * as catalogController from '../controllers/catalogController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/public', catalogController.getPublicCatalog)
router.get('/:id', catalogController.getCatalogItemDetail)
router.post('/:id/rate', requireAuth, catalogController.rateDesign)
router.get('/:id/ratings', catalogController.getDesignRatings)
router.post('/share/:generationId', requireAuth, catalogController.shareDesignToPublic)

export default router
