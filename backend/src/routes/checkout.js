import express from 'express'
import * as checkoutController from '../controllers/checkoutController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/payment-intent', requireAuth, checkoutController.createPaymentIntentController)
router.post('/confirm', requireAuth, checkoutController.confirmPayment)
router.post('/shipping', requireAuth, checkoutController.calculateShipping)

export default router
