import pool from '../config/database.js'
import * as Reservation from '../models/Reservation.js'
import * as SalonService from '../models/SalonService.js'
import * as AvailabilityBlock from '../models/AvailabilityBlock.js'

/**
 * Modificar una reserva existente sin cancelar
 * Permite cambiar: fecha/hora, servicio, notas
 */
export const modifyReservation = async (req, res) => {
  const client = await pool.connect()

  try {
    const { reservationId } = req.params
    const userId = req.user?.id
    const { serviceId, startTime, endTime, notes } = req.body

    await client.query('BEGIN')

    const reservationResult = await client.query(
      `SELECT r.*, s.salon_profile_id, s.name as current_service_name
       FROM reservations r
       JOIN salon_services s ON r.service_id = s.id
       WHERE r.id = $1`,
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Reservation not found' })
    }

    const reservation = reservationResult.rows[0]

    if (reservation.user_id !== userId) {
      await client.query('ROLLBACK')
      return res.status(403).json({ error: 'Not authorized to modify this reservation' })
    }

    if (reservation.status === 'cancelled') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Cannot modify cancelled reservation' })
    }

    if (reservation.status === 'completed') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Cannot modify completed reservation' })
    }

    const updates = {}
    const auditLog = {
      reservation_id: reservationId,
      user_id: userId,
      action: 'modified',
      changes: {},
      timestamp: new Date()
    }

    if (serviceId && serviceId !== reservation.service_id) {
      const newService = await SalonService.findServiceById(serviceId)

      if (!newService) {
        await client.query('ROLLBACK')
        return res.status(404).json({ error: 'Service not found' })
      }

      if (newService.salon_profile_id !== reservation.salon_profile_id) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Service must be from the same salon' })
      }

      updates.service_id = serviceId
      updates.total_price = parseFloat(newService.price)

      const commissionPercentage = reservation.commission_percentage || 3.00
      const commissionAmount = (updates.total_price * commissionPercentage) / 100
      updates.commission_amount = commissionAmount
      updates.amount_to_commerce = updates.total_price - commissionAmount

      auditLog.changes.service = {
        from: reservation.current_service_name,
        to: newService.name,
        price_change: {
          from: parseFloat(reservation.total_price),
          to: updates.total_price
        }
      }
    }

    if (startTime || endTime) {
      const newStartTime = startTime || reservation.start_time
      const newEndTime = endTime || reservation.end_time

      if (new Date(newEndTime) <= new Date(newStartTime)) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'End time must be after start time' })
      }

      const isBlocked = await AvailabilityBlock.isSlotBlocked(
        reservation.salon_profile_id,
        newStartTime,
        newEndTime
      )

      if (isBlocked) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'New time slot is blocked by the salon' })
      }

      const overlapping = await client.query(
        `SELECT id FROM reservations
         WHERE salon_profile_id = $1
           AND id != $2
           AND status NOT IN ('cancelled', 'no_show')
           AND (
             (start_time <= $3 AND end_time > $3)
             OR (start_time < $4 AND end_time >= $4)
             OR (start_time >= $3 AND end_time <= $4)
           )`,
        [reservation.salon_profile_id, reservationId, newStartTime, newEndTime]
      )

      if (overlapping.rows.length > 0) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'New time slot is already booked' })
      }

      if (startTime) {
        updates.start_time = startTime
        auditLog.changes.start_time = {
          from: reservation.start_time,
          to: startTime
        }
      }

      if (endTime) {
        updates.end_time = endTime
        auditLog.changes.end_time = {
          from: reservation.end_time,
          to: endTime
        }
      }
    }

    if (notes !== undefined) {
      updates.notes = notes
      auditLog.changes.notes = {
        from: reservation.notes,
        to: notes
      }
    }

    if (Object.keys(updates).length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updates.updated_at = 'NOW()'

    const fields = []
    const values = []
    let paramCount = 1

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'updated_at') {
        fields.push(`${key} = NOW()`)
      } else {
        fields.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    values.push(reservationId)

    await client.query(
      `UPDATE reservations
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}`,
      values
    )

    await client.query(
      `INSERT INTO reservation_audit_log (reservation_id, user_id, action, changes)
       VALUES ($1, $2, $3, $4)`,
      [reservationId, userId, 'modified', JSON.stringify(auditLog.changes)]
    )

    const updatedReservation = await client.query(
      `SELECT r.*, s.name as service_name, sp.business_name as salon_name
       FROM reservations r
       JOIN salon_services s ON r.service_id = s.id
       JOIN salon_profiles sp ON s.salon_profile_id = sp.id
       WHERE r.id = $1`,
      [reservationId]
    )

    await client.query('COMMIT')

    return res.status(200).json({
      success: true,
      message: 'Reservation modified successfully',
      reservation: updatedReservation.rows[0],
      changes: auditLog.changes
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error modifying reservation:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  } finally {
    client.release()
  }
}

/**
 * Obtener historial de cambios de una reserva
 */
export const getReservationHistory = async (req, res) => {
  try {
    const { reservationId } = req.params
    const userId = req.user?.id

    const reservationResult = await pool.query(
      'SELECT user_id FROM reservations WHERE id = $1',
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    if (reservationResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const history = await pool.query(
      `SELECT * FROM reservation_audit_log
       WHERE reservation_id = $1
       ORDER BY created_at DESC`,
      [reservationId]
    )

    return res.status(200).json({
      success: true,
      history: history.rows
    })

  } catch (error) {
    console.error('Error getting reservation history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
