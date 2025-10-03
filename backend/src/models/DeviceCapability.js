import pool from '../config/database.js'

export const createCapability = async ({ deviceId, capabilityType, metadata = {} }) => {
  const result = await pool.query(
    `INSERT INTO device_capabilities (device_id, capability_type, metadata)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [deviceId, capabilityType, JSON.stringify(metadata)]
  )
  return result.rows[0]
}

export const findCapabilitiesByDevice = async (deviceId) => {
  const result = await pool.query(
    `SELECT * FROM device_capabilities 
     WHERE device_id = $1 AND is_active = true
     ORDER BY capability_type`,
    [deviceId]
  )
  return result.rows
}

export const findCapabilityById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM device_capabilities WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const updateCapability = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    if (key === 'metadata') {
      fields.push(`${snakeKey} = $${paramCount}`)
      values.push(JSON.stringify(value))
    } else {
      fields.push(`${snakeKey} = $${paramCount}`)
      values.push(value)
    }
    paramCount++
  })

  if (fields.length === 0) {
    return await findCapabilityById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE device_capabilities 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteCapability = async (id) => {
  const result = await pool.query(
    `UPDATE device_capabilities 
     SET is_active = false 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const hasCapability = async (deviceId, capabilityType) => {
  const result = await pool.query(
    `SELECT EXISTS(
      SELECT 1 FROM device_capabilities 
      WHERE device_id = $1 
        AND capability_type = $2 
        AND is_active = true
    ) as has_capability`,
    [deviceId, capabilityType]
  )
  return result.rows[0].has_capability
}
