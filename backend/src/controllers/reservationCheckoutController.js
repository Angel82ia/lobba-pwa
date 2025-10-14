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
 * Procesar checkout de reserva
 * 1. Validar servicio y horario
 * 2. Verificar que salón tenga Stripe Connect
 * 3. Crear reserva (status='pending')
 * 4. Crear Split Payment Intent
 * 5. Devolver client_secret para frontend
 */
export const processReservationCheckout = async (req, res) => {
  const client = await pool.connect()

  try {
    const { userId } = req.user
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

    if (!salon.stripe_connect_account_id || !salon.stripe_connect_enabled) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        error: 'This salon has not configured payment reception yet. Please contact the salon.' 
      })
    }

    const overlappingReservations = await client.query(
      `SELECT id FROM reservations
       WHERE salon_profile_id = $1
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time <= $2 AND end_time > $2)
           OR (start_time < $3 AND end_time >= $3)
           OR (start_time >= $2 AND end_time <= $3)
         )`,
      [service.salon_profile_id, startTime, endTime]
    )

    if (overlappingReservations.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'This time slot is already booked' })
    }

    const totalPrice = parseFloat(service.price)
    const commissionPercentage = 3.00

    const reservation = await Reservation.createReservation({
      userId,
      salonProfileId: service.salon_profile_id,
      serviceId: service.id,
      startTime,
      endTime,
      totalPrice,
      notes,
      clientPhone
    })

    await client.query(
      `UPDATE reservations 
       SET commission_percentage = $1
       WHERE id = $2`,
      [commissionPercentage, reservation.id]
    )

    const updatedReservation = await Reservation.findReservationById(reservation.id)

    const paymentIntent = await createSplitPayment(updatedReservation)

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      reservation: {
        id: reservation.id,
        serviceId: service.id,
        serviceName: service.name,
        salonName: salon.business_name,
        startTime,
        endTime,
        totalPrice,
        commissionAmount: updatedReservation.commission_amount,
        amountToCommerce: updatedReservation.amount_to_commerce
      },
      paymentIntent: {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
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
 * Confirmar reserva tras pago exitoso
 */
export const confirmReservation = async (req, res) => {
  try {
    const { paymentIntentId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' })
    }

    await confirmReservationPayment(paymentIntentId)

    const reservationResult = await pool.query(
      'SELECT * FROM reservations WHERE stripe_payment_intent_id = $1',
      [paymentIntentId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    return res.status(200).json({
      success: true,
      reservation: reservationResult.rows[0]
    })

  } catch (error) {
    console.error('Error confirming reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
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
