import express from 'express'
import { body } from 'express-validator'
import * as wishlistController from '../controllers/wishlistController.js'
import { requireAuth } from '../middleware/auth.js'
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', requireAuth, wishlistController.getWishlist)
router.post('/', requireAuth, [
  body('productId').isUUID().withMessage('Valid product ID is required')
], auditUserAction, wishlistController.addToWishlist)
router.delete('/:productId', requireAuth, auditUserAction, wishlistController.removeFromWishlist)

export default router
