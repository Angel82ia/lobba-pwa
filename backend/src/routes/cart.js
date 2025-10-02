import express from 'express'
import * as cartController from '../controllers/cartController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, cartController.getCart)
router.post('/add', requireAuth, cartController.addToCart)
router.put('/items/:id', requireAuth, cartController.updateCartItem)
router.delete('/items/:id', requireAuth, cartController.removeFromCart)
router.delete('/', requireAuth, cartController.clearCart)

export default router
