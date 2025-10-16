import pool from '../config/database.js'

export const createService = async ({
  salonProfileId,
  name,
  description,
  price,
  durationMinutes,
  discountPercentage,
}) => {
  const result = await pool.query(
    `INSERT INTO salon_services 
     (salon_profile_id, name, description, price, duration_minutes, discount_percentage)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [salonProfileId, name, description || null, price, durationMinutes, discountPercentage || 0]
  )
  return result.rows[0]
}

export const findServiceById = async id => {
  const result = await pool.query(`SELECT * FROM salon_services WHERE id = $1`, [id])
  return result.rows[0]
}

export const findServicesBySalonId = async (salonProfileId, { includeInactive = false } = {}) => {
  let query = `SELECT * FROM salon_services WHERE salon_profile_id = $1`

  if (!includeInactive) {
    query += ` AND is_active = true`
  }

  query += ` ORDER BY name ASC`

  const result = await pool.query(query, [salonProfileId])
  return result.rows
}

export const updateService = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'sortOrder') {
      // Ignore legacy field not present in schema
      return
    }
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    fields.push(`${snakeKey} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  if (fields.length === 0) {
    return await findServiceById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE salon_services 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteService = async id => {
  const result = await pool.query(
    `UPDATE salon_services 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
