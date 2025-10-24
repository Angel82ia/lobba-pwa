import express from 'express'
import * as webhookController from '../controllers/webhookController.js'

const router = express.Router()

router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook)

router.post('/twilio/status', express.urlencoded({ extended: false }), webhookController.handleTwilioStatusCallback)

export default router
