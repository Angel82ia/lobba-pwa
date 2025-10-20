import pool from '../config/database.js'

/**
 * Rechazar una reserva (salon owner)
 */
export const rejectReservation = async (req, res) => {
  try {
    const { reservationId } = req.params
    const { reason } = req.body
    const userId = req.user?.id

    const reservationResult = await pool.query(
      `SELECT r.*, sp.user_id as salon_owner_id
       FROM reservations r
       JOIN salon_profiles sp ON r.salon_profile_id = sp.id
       WHERE r.id = $1`,
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reservations can be rejected' })
    }

    await pool.query(
      `UPDATE reservations
       SET status = 'rejected',
           rejected_at = NOW(),
           rejected_reason = $2
       WHERE id = $1`,
      [reservationId, reason]
    )

    await pool.query(
      `INSERT INTO reservation_audit_log (reservation_id, user_id, action, reason)
       VALUES ($1, $2, 'rejected', $3)`,
      [reservationId, userId, reason]
    )

    return res.status(200).json({
      success: true,
      message: 'Reservation rejected'
    })

  } catch (error) {
    console.error('Error rejecting reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Marcar reserva como en progreso (cliente llegó)
 */
export const startReservation = async (req, res) => {
  try {
    const { reservationId } = req.params
    const userId = req.user?.id

    const reservationResult = await pool.query(
      `SELECT r.*, sp.user_id as salon_owner_id
       FROM reservations r
       JOIN salon_profiles sp ON r.salon_profile_id = sp.id
       WHERE r.id = $1`,
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed reservations can be started' })
    }

    await pool.query(
      `UPDATE reservations
       SET status = 'in_progress',
           in_progress_at = NOW()
       WHERE id = $1`,
      [reservationId]
    )

    await pool.query(
      `INSERT INTO reservation_audit_log (reservation_id, user_id, action)
       VALUES ($1, $2, 'started')`,
      [reservationId, userId]
    )

    return res.status(200).json({
      success: true,
      message: 'Reservation started'
    })

  } catch (error) {
    console.error('Error starting reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Marcar reserva como expirada (timeout service)
 */
export const expireReservation = async (reservationId, reason = 'Confirmation timeout expired') => {
  try {
    await pool.query(
      `UPDATE reservations
       SET status = 'expired',
           expired_at = NOW()
       WHERE id = $1`,
      [reservationId]
    )

    await pool.query(
      `INSERT INTO reservation_audit_log (reservation_id, action, reason)
       VALUES ($1, 'expired', $2)`,
      [reservationId, reason]
    )

    return { success: true }

  } catch (error) {
    console.error('Error expiring reservation:', error)
    throw error
  }
}

/**
 * Reprogramar reserva (crea nueva + marca original como rescheduled)
 */
export const rescheduleReservation = async (req, res) => {
  const client = await pool.connect()

  try {
    const { reservationId } = req.params
    const { newStartTime, newEndTime, newServiceId } = req.body
    const userId = req.user?.id

    if (!newStartTime || !newEndTime) {
      return res.status(400).json({ error: 'New start and end times are required' })
    }

    await client.query('BEGIN')

    const reservationResult = await client.query(
      'SELECT * FROM reservations WHERE id = $1',
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const oldReservation = reservationResult.rows[0]

    if (oldReservation.user_id !== userId) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (['cancelled', 'completed', 'rescheduled'].includes(oldReservation.status)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Cannot reschedule ${oldReservation.status} reservation` })
    }

    const newServiceIdToUse = newServiceId || oldReservation.service_id

    const newReservation = await client.query(
      `INSERT INTO reservations (
        user_id, salon_profile_id, service_id,
        start_time, end_time, notes, client_phone, client_email,
        total_price, commission_percentage, commission_amount, amount_to_commerce,
        status, rescheduled_from
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', $13)
      RETURNING *`,
      [
        oldReservation.user_id,
        oldReservation.salon_profile_id,
        newServiceIdToUse,
        newStartTime,
        newEndTime,
        oldReservation.notes,
        oldReservation.client_phone,
        oldReservation.client_email,
        oldReservation.total_price,
        oldReservation.commission_percentage,
        oldReservation.commission_amount,
        oldReservation.amount_to_commerce,
        reservationId
      ]
    )

    await client.query(
      `UPDATE reservations
       SET status = 'rescheduled',
           rescheduled_to = $2
       WHERE id = $1`,
      [reservationId, newReservation.rows[0].id]
    )

    await client.query(
      `INSERT INTO reservation_audit_log (reservation_id, user_id, action, changes)
       VALUES ($1, $2, 'rescheduled', $3)`,
      [
        reservationId,
        userId,
        JSON.stringify({
          new_reservation_id: newReservation.rows[0].id,
          old_time: { start: oldReservation.start_time, end: oldReservation.end_time },
          new_time: { start: newStartTime, end: newEndTime }
        })
      ]
    )

    await client.query('COMMIT')

    return res.status(200).json({
      success: true,
      message: 'Reservation rescheduled',
      oldReservation: oldReservation,
      newReservation: newReservation.rows[0]
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error rescheduling reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * Agregar notas del salón
 */
export const addSalonNotes = async (req, res) => {
  try {
    const { reservationId } = req.params
    const { salonNotes, internalNotes } = req.body
    const userId = req.user?.id

    const reservationResult = await pool.query(
      `SELECT r.*, sp.user_id as salon_owner_id
       FROM reservations r
       JOIN salon_profiles sp ON r.salon_profile_id = sp.id
       WHERE r.id = $1`,
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const updates = []
    const values = []
    let paramCount = 1

    if (salonNotes !== undefined) {
      updates.push(`salon_notes = $${paramCount}`)
      values.push(salonNotes)
      paramCount++
    }

    if (internalNotes !== undefined) {
      updates.push(`internal_notes = $${paramCount}`)
      values.push(internalNotes)
      paramCount++
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No notes provided' })
    }

    values.push(reservationId)

    await pool.query(
      `UPDATE reservations
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}`,
      values
    )

    return res.status(200).json({
      success: true,
      message: 'Notes updated'
    })

  } catch (error) {
    console.error('Error adding salon notes:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
