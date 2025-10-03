import pool from '../config/database.js'

export const createBanner = async ({ title, content, type, imageUrl, priority, startDate, endDate, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO banners (title, content, type, image_url, priority, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [title, content, type, imageUrl, priority, startDate, endDate, createdBy]
  )
  return result.rows[0]
}

export const findBannerById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM banners WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findActiveBanners = async () => {
  const result = await pool.query(
    `SELECT * FROM banners 
     WHERE is_active = true 
       AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
       AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
     ORDER BY priority DESC, created_at DESC`
  )
  return result.rows
}

export const findAllBanners = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT b.*, u.email as creator_email
     FROM banners b
     LEFT JOIN users u ON b.created_by = u.id
     ORDER BY b.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return result.rows
}

export const updateBanner = async (id, updates) => {
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
    return await findBannerById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE banners 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteBanner = async (id) => {
  const result = await pool.query(
    'DELETE FROM banners WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

export const toggleBannerActive = async (id) => {
  const result = await pool.query(
    `UPDATE banners 
     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
