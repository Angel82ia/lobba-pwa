import express from 'express'
import { authenticateUser } from '../middleware/auth.js'
import { checkAutoConfirmation, applyAutoConfirmationManually } from '../controllers/autoConfirmationController.js'

const router = express.Router()

router.get('/check/:reservationId', checkAutoConfirmation)

router.post('/apply/:reservationId', authenticateUser, applyAutoConfirmationManually)

export default router
