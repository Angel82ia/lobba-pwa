import pool from '../config/database.js'

export const createNotification = async ({
  salonProfileId,
  title,
  body,
  type,
  targetingType,
  radiusKm,
  centerLocation,
}) => {
  const values = [salonProfileId, title, body, type, targetingType]
  let paramCount = 6

  let locationSQL = 'NULL'
  if (centerLocation && centerLocation.latitude && centerLocation.longitude) {
    locationSQL = `ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`
    values.push(centerLocation.longitude, centerLocation.latitude)
    paramCount += 2
  }

  if (radiusKm !== undefined) {
    values.push(radiusKm)
  } else {
    values.push(null)
  }

  const result = await pool.query(
    `INSERT INTO notifications 
     (salon_profile_id, title, body, type, targeting_type, radius_km, center_location)
     VALUES ($1, $2, $3, $4, $5, $${paramCount}, ${locationSQL})
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const findNotificationById = async (id) => {
  const result = await pool.query(
    `SELECT n.*,
            ST_Y(n.center_location::geometry) as latitude,
            ST_X(n.center_location::geometry) as longitude
     FROM notifications n 
     WHERE n.id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findNotificationsBySalonId = async (salonProfileId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT n.*,
            ST_Y(n.center_location::geometry) as latitude,
            ST_X(n.center_location::geometry) as longitude
     FROM notifications n 
     WHERE n.salon_profile_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [salonProfileId, limit, offset]
  )
  return result.rows
}

export const findAllNotifications = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT n.*,
            ST_Y(n.center_location::geometry) as latitude,
            ST_X(n.center_location::geometry) as longitude,
            sp.business_name as salon_name
     FROM notifications n 
     JOIN salon_profiles sp ON n.salon_profile_id = sp.id
     ORDER BY n.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return result.rows
}

export const updateNotificationStatus = async (id, status, counts = {}) => {
  const updates = ['status = $1']
  const values = [status]
  let paramCount = 2

  if (counts.sentCount !== undefined) {
    updates.push(`sent_count = $${paramCount}`)
    values.push(counts.sentCount)
    paramCount++
  }

  if (counts.successCount !== undefined) {
    updates.push(`success_count = $${paramCount}`)
    values.push(counts.successCount)
    paramCount++
  }

  if (counts.failureCount !== undefined) {
    updates.push(`failure_count = $${paramCount}`)
    values.push(counts.failureCount)
    paramCount++
  }

  if (status === 'sent') {
    updates.push('sent_at = CURRENT_TIMESTAMP')
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE notifications 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}
