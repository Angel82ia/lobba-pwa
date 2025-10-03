import express from 'express'
import * as wishlistController from '../controllers/wishlistController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, wishlistController.getWishlist)
router.post('/', requireAuth, wishlistController.addToWishlist)
router.delete('/:productId', requireAuth, wishlistController.removeFromWishlist)

export default router
