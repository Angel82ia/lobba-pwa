import express from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth.js'
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
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/slots', requireAuth, getSlots)
router.post('/', requireAuth, [
  body('salonProfileId').isUUID().withMessage('Valid salon profile ID is required'),
  body('serviceId').isUUID().withMessage('Valid service ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('notes').optional().trim()
], auditUserAction, createReservation)
router.get('/:id', requireAuth, getReservation)
router.get('/user/:userId?', requireAuth, getUserReservations)
router.get('/salon/:salonId', requireAuth, getSalonReservations)
router.put('/:id/confirm', requireAuth, auditUserAction, confirmReservation)
router.put('/:id/cancel', requireAuth, [
  body('reason').optional().trim()
], auditUserAction, cancelReservation)
router.put('/:id/complete', requireAuth, [
  body('status').isIn(['completed', 'no_show']).withMessage('Invalid status')
], auditUserAction, completeReservation)

export default router
