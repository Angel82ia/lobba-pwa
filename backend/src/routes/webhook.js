import express from 'express'
import * as webhookController from '../controllers/webhookController.js'

const router = express.Router()

router.use(express.raw({ type: 'application/json' }))

router.post('/stripe', webhookController.handleStripeWebhook)

export default router
