import express from 'express'
import { handleReservationWebhook } from '../controllers/reservationWebhookController.js'

const router = express.Router()

/**
 * Webhook de Stripe para eventos de reservas
 *
 * IMPORTANTE: Este endpoint NO debe tener requireAuth ni JSON parsing
 * - express.raw() es necesario para verificar la firma del webhook
 * - Stripe envía el body como raw bytes
 *
 * Configurar en Stripe Dashboard:
 * 1. Developers → Webhooks → Add endpoint
 * 2. URL: https://api.lobba.com/api/webhooks/stripe-reservation
 * 3. Eventos a escuchar:
 *    - payment_intent.succeeded
 *    - payment_intent.payment_failed
 *    - charge.refunded
 * 4. Copiar "Signing secret" → STRIPE_RESERVATION_WEBHOOK_SECRET
 */

router.use(express.raw({ type: 'application/json' }))

router.post('/stripe-reservation', handleReservationWebhook)

export default router
