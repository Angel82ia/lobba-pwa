import { shouldAutoConfirm, applyAutoConfirmation } from '../services/autoConfirmationService.js'
import pool from '../config/database.js'

/**
 * Verificar si una reserva puede ser autoconfirmada (sin aplicar)
 */
export const checkAutoConfirmation = async (req, res) => {
  try {
    const { reservationId } = req.params

    const reservationResult = await pool.query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    const decision = await shouldAutoConfirm({
      salonProfileId: reservation.salon_profile_id,
      userId: reservation.user_id,
      serviceId: reservation.service_id,
      startTime: reservation.start_time
    })

    return res.status(200).json({
      success: true,
      reservationId,
      canAutoConfirm: decision.shouldAutoConfirm,
      reason: decision.reason,
      checks: decision.checks
    })

  } catch (error) {
    console.error('Error checking auto-confirmation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Aplicar autoconfirmación manualmente a una reserva (admin/salon owner)
 */
export const applyAutoConfirmationManually = async (req, res) => {
  try {
    const { reservationId } = req.params
    const userId = req.user?.id

    const reservationResult = await pool.query(
      `SELECT r.*, s.user_id as salon_owner_id
       FROM reservations r
       JOIN salon_profiles s ON r.salon_profile_id = s.id
       WHERE r.id = $1`,
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this reservation' })
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reservations can be auto-confirmed' })
    }

    const result = await applyAutoConfirmation(reservationId)

    return res.status(200).json({
      success: true,
      applied: result.autoConfirmed,
      reason: result.reason,
      checks: result.checks
    })

  } catch (error) {
    console.error('Error applying auto-confirmation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
