import Stripe from 'stripe'
import pool from '../config/database.js'
import * as Reservation from '../models/Reservation.js'
import logger from '../utils/logger.js'
import { scheduleReminder } from '../services/reminderService.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_RESERVATION_WEBHOOK_SECRET

/**
 * Handler de webhook de Stripe para eventos de reservas
 * Este webhook es el BACKUP si el frontend falla al confirmar la reserva
 *
 * Eventos manejados:
 * - payment_intent.succeeded: Crear reserva si no existe
 * - payment_intent.payment_failed: Loguear fallo
 * - charge.refunded: Marcar reserva como reembolsada
 */
export const handleReservationWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    // Verificar firma del webhook (CRÍTICO para seguridad)
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    logger.error('Reservation webhook signature verification failed', {
      error: err.message,
      signature: sig ? 'present' : 'missing',
    })
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    logger.info('Reservation webhook received', {
      type: event.type,
      id: event.id,
      paymentIntentId: event.data.object.id,
    })

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break
      default:
        logger.info('Unhandled reservation webhook event', { type: event.type })
    }

    res.json({ received: true })
  } catch (error) {
    logger.error('Error processing reservation webhook', {
      error: error.message,
      stack: error.stack,
      eventType: event.type,
    })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Manejar pago exitoso
 * Si la reserva ya existe (confirmada desde frontend), no hacer nada
 * Si NO existe, crearla como BACKUP (el frontend falló)
 */
const handlePaymentIntentSucceeded = async paymentIntent => {
  const { id: paymentIntentId, metadata } = paymentIntent

  logger.info('Processing payment_intent.succeeded', {
    paymentIntentId,
    hasReservationId: !!metadata.reservation_id,
    metadata,
  })

  // Si ya tiene reservation_id, la reserva ya se confirmó desde el frontend
  if (metadata.reservation_id) {
    logger.info('Reservation already confirmed from frontend', {
      reservationId: metadata.reservation_id,
      paymentIntentId,
    })
    return
  }

  // BACKUP: El frontend falló al confirmar, crear reserva desde webhook
  logger.warn('Creating backup reservation from webhook', {
    paymentIntentId,
    reason: 'Frontend confirmation failed',
  })

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Validar metadata completa
    const requiredFields = [
      'user_id',
      'salon_profile_id',
      'service_id',
      'start_time',
      'end_time',
      'total_price',
    ]
    const missingFields = requiredFields.filter(field => !metadata[field])

    if (missingFields.length > 0) {
      throw new Error(`Missing required metadata: ${missingFields.join(', ')}`)
    }

    // Advisory lock para prevenir race conditions
    const lockKey = `${metadata.salon_profile_id}-${metadata.start_time}-${metadata.end_time}`
    const lockHash = parseInt(
      require('crypto').createHash('md5').update(lockKey).digest('hex').substring(0, 8),
      16
    )
    await client.query('SELECT pg_advisory_xact_lock($1)', [lockHash])

    // Verificar disponibilidad (doble check)
    const overlappingReservations = await client.query(
      `SELECT id FROM reservations
       WHERE salon_profile_id = $1
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time <= $2 AND end_time > $2)
           OR (start_time < $3 AND end_time >= $3)
           OR (start_time >= $2 AND end_time <= $3)
         )`,
      [metadata.salon_profile_id, metadata.start_time, metadata.end_time]
    )

    if (overlappingReservations.rows.length > 0) {
      // Slot ocupado, reembolsar
      logger.warn('Slot occupied during webhook processing, refunding', {
        paymentIntentId,
        overlappingReservations: overlappingReservations.rows.map(r => r.id),
      })

      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'duplicate',
        metadata: {
          refund_reason: 'Slot occupied during webhook processing',
          original_payment_intent: paymentIntentId,
        },
      })

      await client.query('ROLLBACK')

      logger.info('Refund initiated for occupied slot', { paymentIntentId })
      return
    }

    // Crear reserva
    const reservation = await Reservation.createReservation({
      userId: metadata.user_id,
      salonProfileId: metadata.salon_profile_id,
      serviceId: metadata.service_id,
      startTime: metadata.start_time,
      endTime: metadata.end_time,
      totalPrice: parseFloat(metadata.total_price),
      notes: metadata.notes || null,
      clientPhone: metadata.client_phone || null,
    })

    // Actualizar con datos de pago
    await client.query(
      `UPDATE reservations
       SET commission_percentage = $1,
           stripe_payment_intent_id = $2,
           payment_status = 'succeeded',
           status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [parseFloat(metadata.commission_percentage || 3.0), paymentIntentId, reservation.id]
    )

    // Actualizar metadata del Payment Intent con reservation_id
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...metadata,
        reservation_id: reservation.id,
        confirmed_via: 'webhook',
      },
    })

    await client.query('COMMIT')

    logger.info('Backup reservation created successfully', {
      reservationId: reservation.id,
      paymentIntentId,
      userId: metadata.user_id,
      salonId: metadata.salon_profile_id,
    })

    // Programar recordatorios
    try {
      await scheduleReminder(reservation)
    } catch (error) {
      logger.error('Error scheduling reminder for backup reservation', {
        reservationId: reservation.id,
        error: error.message,
      })
    }
  } catch (error) {
    await client.query('ROLLBACK')

    logger.error('Error creating backup reservation', {
      paymentIntentId,
      error: error.message,
      stack: error.stack,
    })

    throw error
  } finally {
    client.release()
  }
}

/**
 * Manejar pago fallido
 * Loguear para análisis y alertar al equipo
 */
const handlePaymentIntentFailed = async paymentIntent => {
  const { id: paymentIntentId, metadata, last_payment_error } = paymentIntent

  logger.warn('Payment failed for reservation', {
    paymentIntentId,
    userId: metadata.user_id,
    salonId: metadata.salon_profile_id,
    serviceId: metadata.service_id,
    errorCode: last_payment_error?.code,
    errorMessage: last_payment_error?.message,
    declineCode: last_payment_error?.decline_code,
  })

  // TODO: Enviar notificación al usuario (opcional)
  // TODO: Alertar al equipo si hay muchos fallos
}

/**
 * Manejar reembolso
 * Actualizar estado de la reserva a 'refunded' y 'cancelled'
 */
const handleChargeRefunded = async charge => {
  const { payment_intent: paymentIntentId, amount_refunded, refund } = charge

  logger.info('Processing refund for reservation', {
    paymentIntentId,
    amountRefunded: amount_refunded / 100,
    refundId: refund,
  })

  try {
    // Buscar reserva por payment_intent_id
    const result = await pool.query(
      'SELECT * FROM reservations WHERE stripe_payment_intent_id = $1',
      [paymentIntentId]
    )

    if (result.rows.length === 0) {
      logger.warn('No reservation found for refunded payment', { paymentIntentId })
      return
    }

    const reservation = result.rows[0]

    // Actualizar estado a refunded
    await pool.query(
      `UPDATE reservations
       SET payment_status = 'refunded',
           status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           cancellation_reason = COALESCE(cancellation_reason, 'Refund processed by Stripe')
       WHERE id = $1`,
      [reservation.id]
    )

    logger.info('Reservation marked as refunded', {
      reservationId: reservation.id,
      paymentIntentId,
      previousStatus: reservation.status,
    })
  } catch (error) {
    logger.error('Error processing refund', {
      paymentIntentId,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}
