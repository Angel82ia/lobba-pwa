import express from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth.js'
import {
  calculateReservationCheckout,
  processReservationCheckout,
  confirmReservation,
  cancelAndRefundReservation,
} from '../controllers/reservationCheckoutController.js'

const router = express.Router()

router.use(requireAuth)

router.post('/calculate', calculateReservationCheckout)

router.post(
  '/process',
  [
    body('serviceId').isUUID().withMessage('Valid service ID is required'),

    body('startTime')
      .isISO8601()
      .withMessage('Valid start time is required')
      .custom(value => {
        const startDate = new Date(value)
        const now = new Date()

        // Validar que sea futuro (al menos 30 minutos desde ahora)
        const minimumTime = new Date(now.getTime() + 30 * 60 * 1000)
        if (startDate < minimumTime) {
          throw new Error('Start time must be at least 30 minutes in the future')
        }

        // Validar que no sea más de 6 meses en el futuro
        const maxTime = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
        if (startDate > maxTime) {
          throw new Error('Start time cannot be more than 6 months in the future')
        }

        return true
      }),

    body('endTime')
      .isISO8601()
      .withMessage('Valid end time is required')
      .custom((value, { req }) => {
        const endDate = new Date(value)
        const startDate = new Date(req.body.startTime)

        if (endDate <= startDate) {
          throw new Error('End time must be after start time')
        }

        // Validar duración máxima (8 horas)
        const maxDuration = 8 * 60 * 60 * 1000
        if (endDate - startDate > maxDuration) {
          throw new Error('Reservation duration cannot exceed 8 hours')
        }

        return true
      }),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
      .escape(),

    body('clientPhone')
      .optional()
      .trim()
      .matches(/^\+?[0-9\s\-()]{9,15}$/)
      .withMessage('Invalid phone format (must be 9-15 digits)')
      .isLength({ max: 20 })
      .withMessage('Phone number is too long'),
  ],
  processReservationCheckout
)

router.post('/confirm', confirmReservation)

router.delete('/:reservationId/cancel', cancelAndRefundReservation)

export default router
