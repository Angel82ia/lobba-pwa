import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getSlots,
  createReservation,
  getReservation,
  getUserReservations,
  getSalonReservations,
  confirmReservation,
  cancelReservation,
  completeReservation,
} from '../controllers/reservationController.js'

const router = express.Router()

router.get('/slots', authenticate, getSlots)
router.post('/', authenticate, createReservation)
router.get('/:id', authenticate, getReservation)
router.get('/user/:userId?', authenticate, getUserReservations)
router.get('/salon/:salonId', authenticate, getSalonReservations)
router.put('/:id/confirm', authenticate, confirmReservation)
router.put('/:id/cancel', authenticate, cancelReservation)
router.put('/:id/complete', authenticate, completeReservation)

export default router
