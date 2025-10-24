import express from 'express'
import * as checkoutController from '../controllers/checkoutController.js'
import { requireAuth } from '../middleware/auth.js'
import { paymentLimiter } from '../middleware/rateLimits.js'
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.post('/payment-intent', requireAuth, paymentLimiter, auditUserAction, checkoutController.createPaymentIntentController)
router.post('/confirm', requireAuth, paymentLimiter, auditUserAction, checkoutController.confirmPayment)
router.post('/shipping', requireAuth, checkoutController.calculateShipping)
router.post('/validate-code', requireAuth, checkoutController.validateDiscountCode)

export default router
