import pool from '../config/database.js'

export const createEquipment = async ({
  name,
  description,
  category,
  imageUrl,
  requiresReturn = true,
  maxLoanDays = 7,
  currentLocation = null
}) => {
  const result = await pool.query(
    `INSERT INTO equipment (name, description, category, image_url, requires_return, max_loan_days, current_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description, category, imageUrl, requiresReturn, maxLoanDays, currentLocation]
  )
  return result.rows[0]
}

export const findEquipmentById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM equipment WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findAllEquipment = async ({ 
  page = 1, 
  limit = 50, 
  status = null, 
  category = null,
  isActive = true 
} = {}) => {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM equipment WHERE 1=1'
  const params = []
  let paramCount = 1

  if (isActive !== null) {
    query += ` AND is_active = $${paramCount}`
    params.push(isActive)
    paramCount++
  }

  if (status) {
    query += ` AND status = $${paramCount}`
    params.push(status)
    paramCount++
  }

  if (category) {
    query += ` AND category = $${paramCount}`
    params.push(category)
    paramCount++
  }

  query += ` ORDER BY name LIMIT $${paramCount} OFFSET $${paramCount + 1}`
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const updateEquipment = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    fields.push(`${snakeKey} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  if (fields.length === 0) {
    return await findEquipmentById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE equipment 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteEquipment = async (id) => {
  const result = await pool.query(
    `UPDATE equipment 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const updateEquipmentStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE equipment 
     SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [status, id]
  )
  return result.rows[0]
}

export const updateEquipmentLocation = async (id, locationId) => {
  const result = await pool.query(
    `UPDATE equipment 
     SET current_location = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [locationId, id]
  )
  return result.rows[0]
}

export const findAvailableEquipment = async (category = null) => {
  let query = `SELECT * FROM equipment 
               WHERE status = 'available' 
                 AND is_active = true`
  const params = []

  if (category) {
    query += ' AND category = $1'
    params.push(category)
  }

  query += ' ORDER BY name'

  const result = await pool.query(query, params)
  return result.rows
}
