import pool from '../config/database.js'
import { refundReservationPayment } from './stripeConnectService.js'

/**
 * Procesar timeouts de reservas pendientes (ejecutar cada minuto)
 * Cancela reservas pending que excedieron 2h sin confirmación
 */
export const processReservationTimeouts = async () => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const expiredReservations = await client.query(
      `SELECT id, stripe_payment_intent_id, user_id, salon_profile_id, total_price
       FROM reservations
       WHERE status = 'pending'
         AND confirmation_deadline IS NOT NULL
         AND confirmation_deadline < NOW()
         AND auto_cancelled = false
       FOR UPDATE SKIP LOCKED`,
      []
    )

    console.log(`[Timeout Service] Found ${expiredReservations.rows.length} expired reservations`)

    for (const reservation of expiredReservations.rows) {
      try {
        if (reservation.stripe_payment_intent_id) {
          await refundReservationPayment(
            reservation.id,
            'Reserva cancelada automáticamente: no confirmada en 2 horas'
          )
          console.log(`[Timeout Service] Refunded reservation ${reservation.id}`)
        }

        await client.query(
          `UPDATE reservations
           SET status = 'cancelled',
               auto_cancelled = true,
               auto_cancel_reason = 'Timeout: no confirmada en 2 horas',
               cancelled_at = NOW()
           WHERE id = $1`,
          [reservation.id]
        )

        console.log(`[Timeout Service] Cancelled reservation ${reservation.id}`)

      } catch (error) {
        console.error(`[Timeout Service] Error processing reservation ${reservation.id}:`, error)
      }
    }

    await client.query('COMMIT')

    return {
      processed: expiredReservations.rows.length,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[Timeout Service] Error processing timeouts:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Establecer deadline de confirmación al crear reserva
 * @param {Number} reservationId - ID de la reserva
 * @param {Number} hoursLimit - Horas límite (default: 2)
 */
export const setConfirmationDeadline = async (reservationId, hoursLimit = 2) => {
  try {
    await pool.query(
      `UPDATE reservations
       SET confirmation_deadline = NOW() + INTERVAL '${hoursLimit} hours'
       WHERE id = $1`,
      [reservationId]
    )

    console.log(`[Timeout Service] Set ${hoursLimit}h deadline for reservation ${reservationId}`)

  } catch (error) {
    console.error(`[Timeout Service] Error setting deadline for ${reservationId}:`, error)
    throw error
  }
}

/**
 * Verificar si una reserva está cerca del timeout
 * @param {Number} reservationId - ID de la reserva
 * @returns {Object} - { expired, minutesRemaining, deadline }
 */
export const checkReservationTimeout = async (reservationId) => {
  try {
    const result = await pool.query(
      `SELECT 
         confirmation_deadline,
         EXTRACT(EPOCH FROM (confirmation_deadline - NOW())) / 60 as minutes_remaining,
         (confirmation_deadline < NOW()) as expired
       FROM reservations
       WHERE id = $1`,
      [reservationId]
    )

    if (result.rows.length === 0) {
      throw new Error('Reservation not found')
    }

    const row = result.rows[0]

    return {
      expired: row.expired,
      minutesRemaining: Math.max(0, Math.floor(row.minutes_remaining || 0)),
      deadline: row.confirmation_deadline
    }

  } catch (error) {
    console.error(`[Timeout Service] Error checking timeout for ${reservationId}:`, error)
    throw error
  }
}

/**
 * Inicializar servicio de timeout (ejecutar periódicamente)
 * @param {Number} intervalMinutes - Intervalo en minutos (default: 1)
 */
export const initTimeoutService = (intervalMinutes = 1) => {
  console.log(`[Timeout Service] Starting with ${intervalMinutes} minute interval`)

  const intervalId = setInterval(async () => {
    try {
      const result = await processReservationTimeouts()
      if (result.processed > 0) {
        console.log(`[Timeout Service] Processed ${result.processed} timeouts at ${result.timestamp}`)
      }
    } catch (error) {
      console.error('[Timeout Service] Interval error:', error)
    }
  }, intervalMinutes * 60 * 1000)

  processReservationTimeouts().catch(err => {
    console.error('[Timeout Service] Initial run error:', err)
  })

  return intervalId
}
