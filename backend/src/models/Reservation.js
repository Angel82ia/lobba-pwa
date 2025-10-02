import pool from '../config/database.js'

export const createReservation = async ({
  userId,
  salonProfileId,
  serviceId,
  startTime,
  endTime,
  totalPrice,
  notes = null,
  clientPhone = null,
  clientEmail = null,
  bufferMinutes = 15,
}) => {
  const result = await pool.query(
    `INSERT INTO reservations 
     (user_id, salon_profile_id, service_id, start_time, end_time, total_price, notes, client_phone, client_email, status, buffer_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
     RETURNING *`,
    [userId, salonProfileId, serviceId, startTime, endTime, totalPrice, notes, clientPhone, clientEmail, bufferMinutes]
  )
  return result.rows[0]
}

export const findReservationById = async (id) => {
  const result = await pool.query(
    `SELECT r.*, 
            u.first_name, u.last_name, u.email,
            sp.business_name, sp.address, sp.city, sp.phone as salon_phone,
            ss.name as service_name, ss.duration_minutes
     FROM reservations r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN salon_profiles sp ON r.salon_profile_id = sp.id
     LEFT JOIN salon_services ss ON r.service_id = ss.id
     WHERE r.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export const findReservationsByUserId = async (userId, filters = {}) => {
  let query = `
    SELECT r.*, 
           sp.business_name, sp.address, sp.city,
           ss.name as service_name, ss.duration_minutes
    FROM reservations r
    LEFT JOIN salon_profiles sp ON r.salon_profile_id = sp.id
    LEFT JOIN salon_services ss ON r.service_id = ss.id
    WHERE r.user_id = $1
  `
  const params = [userId]
  let paramCount = 1

  if (filters.status) {
    paramCount++
    query += ` AND r.status = $${paramCount}`
    params.push(filters.status)
  }

  if (filters.startDate) {
    paramCount++
    query += ` AND r.start_time >= $${paramCount}`
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    paramCount++
    query += ` AND r.start_time <= $${paramCount}`
    params.push(filters.endDate)
  }

  query += ` ORDER BY r.start_time DESC`

  const result = await pool.query(query, params)
  return result.rows
}

export const findReservationsBySalonId = async (salonProfileId, filters = {}) => {
  let query = `
    SELECT r.*, 
           u.first_name, u.last_name, u.email,
           r.client_phone,
           ss.name as service_name, ss.duration_minutes
    FROM reservations r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN salon_services ss ON r.service_id = ss.id
    WHERE r.salon_profile_id = $1
  `
  const params = [salonProfileId]
  let paramCount = 1

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      paramCount++
      query += ` AND r.status = ANY($${paramCount}::text[])`
      params.push(filters.status)
    } else {
      paramCount++
      query += ` AND r.status = $${paramCount}`
      params.push(filters.status)
    }
  }

  if (filters.startDate) {
    paramCount++
    query += ` AND r.start_time >= $${paramCount}`
    params.push(filters.startDate)
  }

  if (filters.endDate) {
    paramCount++
    query += ` AND r.start_time <= $${paramCount}`
    params.push(filters.endDate)
  }

  query += ` ORDER BY r.start_time ASC`

  const result = await pool.query(query, params)
  return result.rows
}

export const updateReservationStatus = async (id, status, metadata = {}) => {
  const fields = ['status = $2']
  const params = [id, status]
  let paramCount = 2

  if (metadata.googleCalendarEventId) {
    paramCount++
    fields.push(`google_calendar_event_id = $${paramCount}`)
    params.push(metadata.googleCalendarEventId)
  }

  if (metadata.depositPaid !== undefined) {
    paramCount++
    fields.push(`deposit_paid = $${paramCount}`)
    params.push(metadata.depositPaid)
  }

  const query = `
    UPDATE reservations
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `

  const result = await pool.query(query, params)
  return result.rows[0]
}

export const cancelReservation = async (id, reason) => {
  const result = await pool.query(
    `UPDATE reservations
     SET status = 'cancelled', cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, reason]
  )
  return result.rows[0]
}
