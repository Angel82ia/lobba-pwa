import express from 'express'
import { body } from 'express-validator'
import * as cartController from '../controllers/cartController.js'
import { requireAuth } from '../middleware/auth.js'
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', requireAuth, cartController.getCart)
router.post('/add', requireAuth, [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], auditUserAction, cartController.addToCart)
router.put('/items/:id', requireAuth, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], auditUserAction, cartController.updateCartItem)
router.delete('/items/:id', requireAuth, auditUserAction, cartController.removeFromCart)
router.delete('/', requireAuth, auditUserAction, cartController.clearCart)

export default router
