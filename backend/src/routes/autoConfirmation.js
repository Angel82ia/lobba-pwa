import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  checkAutoConfirmation,
  applyAutoConfirmationManually,
} from '../controllers/autoConfirmationController.js'

const router = express.Router()

router.get('/check/:reservationId', checkAutoConfirmation)

router.post('/apply/:reservationId', requireAuth, applyAutoConfirmationManually)

export default router
