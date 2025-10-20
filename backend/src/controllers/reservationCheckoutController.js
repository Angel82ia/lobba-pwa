import pool from '../config/database.js'
import * as Reservation from '../models/Reservation.js'
import * as SalonService from '../models/SalonService.js'
import { createSplitPayment, confirmReservationPayment, refundReservationPayment } from '../services/stripeConnectService.js'

/**
 * Calcular totales de checkout para reserva de servicio
 */
export const calculateReservationCheckout = async (req, res) => {
  try {
    const { serviceId, startTime, endTime } = req.body

    if (!serviceId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Service ID, start time and end time are required' })
    }

    const service = await SalonService.findServiceById(serviceId)

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const totalPrice = parseFloat(service.price)
    const commissionPercentage = 3.00
    const commissionAmount = (totalPrice * commissionPercentage) / 100
    const amountToCommerce = totalPrice - commissionAmount

    return res.status(200).json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        price: totalPrice,
        durationMinutes: service.duration_minutes
      },
      breakdown: {
        totalPrice,
        commissionPercentage,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        amountToLobba: parseFloat(commissionAmount.toFixed(2)),
        amountToCommerce: parseFloat(amountToCommerce.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error calculating reservation checkout:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Procesar checkout de reserva - ORDEN CORRECTO V3.0
 * 1. Advisory Lock del slot (evitar race conditions)
 * 2. Validar servicio y disponibilidad
 * 3. Verificar que salón tenga Stripe Connect
 * 4. Crear Payment Intent (SIN crear reserva aún)
 * 5. Devolver client_secret para frontend
 * 
 * La reserva se crea SOLO tras confirmar pago en confirmReservation()
 */
export const processReservationCheckout = async (req, res) => {
  const client = await pool.connect()

  try {
    const userId = req.user.id
    const {
      serviceId,
      startTime,
      endTime,
      notes,
      clientPhone
    } = req.body

    if (!serviceId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Service ID, start time and end time are required' })
    }

    await client.query('BEGIN')

    const service = await SalonService.findServiceById(serviceId)

    if (!service) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Service not found' })
    }

    const salonResult = await client.query(
      'SELECT * FROM salon_profiles WHERE id = $1',
      [service.salon_profile_id]
    )

    if (salonResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Salon not found' })
    }

    const salon = salonResult.rows[0]

    // 2. Verificar Stripe Connect
    if (!salon.stripe_connect_account_id || !salon.stripe_connect_enabled) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: 'This salon has not configured payment reception yet. Please contact the salon.' 
      })
    }

    const lockKey = `${service.salon_profile_id}-${startTime}-${endTime}`
    const lockHash = parseInt(
      require('crypto').createHash('md5').update(lockKey).digest('hex').substring(0, 8),
      16
    )
    
    await client.query('SELECT pg_advisory_xact_lock($1)', [lockHash])

    const overlappingReservations = await client.query(
      `SELECT COUNT(*) as count
       FROM reservations
       WHERE salon_profile_id = $1
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time <= $2 AND end_time > $2)
           OR (start_time < $3 AND end_time >= $3)
           OR (start_time >= $2 AND end_time <= $3)
         )`,
      [service.salon_profile_id, startTime, endTime]
    )

    const currentCount = parseInt(overlappingReservations.rows[0].count)

    if (currentCount >= maxCapacity) {
      await client.query('ROLLBACK')
      return res.status(409).json({ 
        error: 'SLOT_NO_LONGER_AVAILABLE',
        message: 'This time slot was just booked by another user. Please select a different time.'
      })
    }

    const totalPrice = parseFloat(service.price)
    const commissionPercentage = 3.00
    const commissionAmount = (totalPrice * commissionPercentage) / 100
    const amountToCommerce = totalPrice - commissionAmount

    const stripe = await import('stripe').then(m => m.default(process.env.STRIPE_SECRET_KEY))
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100),
      currency: 'eur',
      application_fee_amount: Math.round(commissionAmount * 100),
      transfer_data: {
        destination: salon.stripe_connect_account_id,
      },
      metadata: {
        user_id: userId,
        salon_profile_id: service.salon_profile_id,
        service_id: service.id,
        service_name: service.name,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice.toFixed(2),
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount.toFixed(2),
        amount_to_commerce: amountToCommerce.toFixed(2),
        notes: notes || '',
        client_phone: clientPhone || ''
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    await client.query('COMMIT')

    return res.status(200).json({
      success: true,
      message: 'Payment intent created. Complete payment to confirm reservation.',
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.duration_minutes
      },
      salon: {
        id: salon.id,
        name: salon.business_name
      },
      schedule: {
        startTime,
        endTime
      },
      pricing: {
        totalPrice,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        amountToCommerce: parseFloat(amountToCommerce.toFixed(2))
      },
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalPrice
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error processing reservation checkout:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * Confirmar reserva tras pago exitoso - ORDEN CORRECTO V3.0
 * 1. Verificar que Payment Intent está succeeded
 * 2. Extraer metadata del Payment Intent
 * 3. Verificar disponibilidad nuevamente (doble check)
 * 4. Crear reserva con status='confirmed'
 * 5. Actualizar Payment Intent con reservation_id
 */
export const confirmReservation = async (req, res) => {
  const client = await pool.connect()

  try {
    const { paymentIntentId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' })
    }

    await client.query('BEGIN')

    const stripe = await import('stripe').then(m => m.default(process.env.STRIPE_SECRET_KEY))
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: 'PAYMENT_NOT_CONFIRMED',
        message: 'Payment has not been completed successfully'
      })
    }

    const metadata = paymentIntent.metadata
    if (!metadata.user_id || !metadata.salon_profile_id || !metadata.service_id) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: 'INVALID_PAYMENT_INTENT',
        message: 'Payment intent metadata is incomplete'
      })
    }

    const lockKey = `${metadata.salon_profile_id}-${metadata.start_time}-${metadata.end_time}`
    const lockHash = parseInt(
      require('crypto').createHash('md5').update(lockKey).digest('hex').substring(0, 8),
      16
    )
    
    await client.query('SELECT pg_advisory_xact_lock($1)', [lockHash])

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
      await client.query('ROLLBACK')
      
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          refund_reason: 'Slot no longer available after payment'
        }
      })

      return res.status(409).json({ 
        error: 'SLOT_NO_LONGER_AVAILABLE',
        message: 'Time slot was booked while payment was processing. Refund initiated.',
        refunded: true
      })
    }

    const reservation = await Reservation.createReservation({
      userId: metadata.user_id,
      salonProfileId: metadata.salon_profile_id,
      serviceId: metadata.service_id,
      startTime: metadata.start_time,
      endTime: metadata.end_time,
      totalPrice: parseFloat(metadata.total_price),
      notes: metadata.notes || null,
      clientPhone: metadata.client_phone || null
    })

    await client.query(
      `UPDATE reservations 
       SET commission_percentage = $1,
           stripe_payment_intent_id = $2,
           payment_status = 'succeeded',
           status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [parseFloat(metadata.commission_percentage), paymentIntentId, reservation.id]
    )

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...metadata,
        reservation_id: reservation.id
      }
    })

    await client.query('COMMIT')

    const finalReservation = await Reservation.findReservationById(reservation.id)

    return res.status(200).json({
      success: true,
      message: 'Reservation confirmed successfully',
      reservation: finalReservation
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error confirming reservation:', error)
    
    if (error.type === 'StripeCardError' || error.code === 'payment_intent_unexpected_state') {
      return res.status(400).json({ 
        error: 'PAYMENT_ERROR',
        message: error.message 
      })
    }

    return res.status(500).json({ error: error.message || 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * Cancelar y reembolsar reserva
 */
export const cancelAndRefundReservation = async (req, res) => {
  try {
    const { reservationId } = req.params
    const { reason } = req.body
    const { userId } = req.user

    const reservationResult = await pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this reservation' })
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation is already cancelled' })
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed reservation' })
    }

    const refund = await refundReservationPayment(reservationId, reason)

    return res.status(200).json({
      success: true,
      message: 'Reservation cancelled and refunded',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    })

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
