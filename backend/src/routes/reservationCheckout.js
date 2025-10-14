import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { 
  calculateReservationCheckout,
  processReservationCheckout,
  confirmReservation,
  cancelAndRefundReservation
} from '../controllers/reservationCheckoutController.js'

const router = express.Router()

router.use(requireAuth)

router.post('/calculate', calculateReservationCheckout)

router.post('/process', processReservationCheckout)

router.post('/confirm', confirmReservation)

router.delete('/:reservationId/cancel', cancelAndRefundReservation)

export default router
