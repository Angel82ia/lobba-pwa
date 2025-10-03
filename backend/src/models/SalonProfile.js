import pool from '../config/database.js'

export const createSalonProfile = async ({
  userId,
  businessName,
  description,
  address,
  city,
  postalCode,
  phone,
  website,
  location,
  businessHours,
  isClickCollect,
  acceptsReservations,
}) => {
  const values = [userId, businessName, description, address, city, postalCode, phone, website]
  let paramCount = 9

  let locationSQL = 'NULL'
  if (location && location.latitude && location.longitude) {
    locationSQL = `ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`
    values.push(location.longitude, location.latitude)
    paramCount += 2
  }

  if (businessHours) {
    values.push(JSON.stringify(businessHours))
  } else {
    values.push(null)
  }
  paramCount++

  if (isClickCollect !== undefined) {
    values.push(isClickCollect)
  } else {
    values.push(false)
  }
  paramCount++

  if (acceptsReservations !== undefined) {
    values.push(acceptsReservations)
  } else {
    values.push(true)
  }

  const result = await pool.query(
    `INSERT INTO salon_profiles 
     (user_id, business_name, description, address, city, postal_code, phone, website, location, business_hours, is_click_collect, accepts_reservations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${locationSQL}, $${paramCount - 2}, $${paramCount - 1}, $${paramCount})
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const findSalonProfileByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT sp.*, 
            ST_Y(sp.location::geometry) as latitude,
            ST_X(sp.location::geometry) as longitude
     FROM salon_profiles sp 
     WHERE sp.user_id = $1`,
    [userId]
  )
  return result.rows[0]
}

export const findSalonProfileById = async (id) => {
  const result = await pool.query(
    `SELECT sp.*,
            ST_Y(sp.location::geometry) as latitude,
            ST_X(sp.location::geometry) as longitude
     FROM salon_profiles sp 
     WHERE sp.id = $1`,
    [id]
  )
  return result.rows[0]
}

export const updateSalonProfile = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'location' && value) {
      fields.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`)
      values.push(value.longitude, value.latitude)
      paramCount += 2
    } else if (key === 'businessHours' && value) {
      fields.push(`business_hours = $${paramCount}`)
      values.push(JSON.stringify(value))
      paramCount++
    } else {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      fields.push(`${snakeKey} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  })

  if (fields.length === 0) {
    return await findSalonProfileById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE salon_profiles 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteSalonProfile = async (id) => {
  const result = await pool.query(
    `UPDATE salon_profiles 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const findSalonsInRadius = async (centerLocation, radiusKm) => {
  if (!centerLocation || !centerLocation.latitude || !centerLocation.longitude) {
    return []
  }

  const result = await pool.query(
    `SELECT sp.*,
            ST_Y(sp.location::geometry) as latitude,
            ST_X(sp.location::geometry) as longitude,
            ST_Distance(
              sp.location,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) / 1000 as distance_km
     FROM salon_profiles sp 
     WHERE sp.is_active = true
       AND sp.location IS NOT NULL
       AND ST_DWithin(
         sp.location,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3 * 1000
       )
     ORDER BY distance_km ASC`,
    [centerLocation.longitude, centerLocation.latitude, radiusKm]
  )
  return result.rows
}

export const getUsersInRadius = async (centerLocation, radiusKm, notificationType) => {
  const result = await pool.query(
    `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
     FROM users u
     LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
     WHERE u.role = 'user'
       AND (unp.notifications_enabled IS NULL OR unp.notifications_enabled = true)
       AND (unp.max_radius_km IS NULL OR unp.max_radius_km >= $1)
       AND (unp.types_enabled IS NULL OR $2 = ANY(unp.types_enabled))`,
    [radiusKm, notificationType]
  )
  return result.rows
}
