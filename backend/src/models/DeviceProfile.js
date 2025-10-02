import pool from '../config/database.js'

export const createDeviceProfile = async ({
  userId,
  deviceId,
  deviceName,
  deviceType,
  capabilities,
  location,
}) => {
  const locationSQL = location 
    ? `ST_SetSRID(ST_MakePoint($7, $8), 4326)` 
    : 'NULL'

  const params = [
    userId,
    deviceId,
    deviceName,
    deviceType || 'kiosk',
    JSON.stringify(capabilities || []),
  ]

  if (location) {
    params.push(location.longitude, location.latitude)
  }

  const query = `INSERT INTO device_profiles 
     (user_id, device_id, device_name, device_type, capabilities${location ? ', location' : ''})
     VALUES ($1, $2, $3, $4, $5${location ? `, ${locationSQL}` : ''})
     RETURNING *`

  const result = await pool.query(query, params)
  return result.rows[0]
}

export const findDeviceProfileById = async (id) => {
  const result = await pool.query(
    `SELECT *,
            ST_Y(location::geometry) as latitude,
            ST_X(location::geometry) as longitude
     FROM device_profiles 
     WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findDeviceProfileByDeviceId = async (deviceId) => {
  const result = await pool.query(
    `SELECT *,
            ST_Y(location::geometry) as latitude,
            ST_X(location::geometry) as longitude
     FROM device_profiles 
     WHERE device_id = $1`,
    [deviceId]
  )
  return result.rows[0]
}

export const findDeviceProfileByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT *,
            ST_Y(location::geometry) as latitude,
            ST_X(location::geometry) as longitude
     FROM device_profiles 
     WHERE user_id = $1`,
    [userId]
  )
  return result.rows[0]
}

export const updateDeviceProfile = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'location' && value) {
      fields.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`)
      values.push(value.longitude, value.latitude)
      paramCount += 2
    } else if (key === 'capabilities') {
      fields.push(`capabilities = $${paramCount}`)
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
    return await findDeviceProfileById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE device_profiles 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *,
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude`,
    values
  )

  return result.rows[0]
}

export const deleteDeviceProfile = async (id) => {
  const result = await pool.query(
    `UPDATE device_profiles 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const updateDeviceCapabilities = async (id, capabilities) => {
  const result = await pool.query(
    `UPDATE device_profiles 
     SET capabilities = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [JSON.stringify(capabilities), id]
  )
  return result.rows[0]
}

export const updateDeviceLocation = async (id, location) => {
  const result = await pool.query(
    `UPDATE device_profiles 
     SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326), 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *,
               ST_Y(location::geometry) as latitude,
               ST_X(location::geometry) as longitude`,
    [location.longitude, location.latitude, id]
  )
  return result.rows[0]
}
