import pool from '../config/database.js'

export const createSavedDesign = async ({ userId, generationId, title }) => {
  const result = await pool.query(
    `INSERT INTO saved_designs (user_id, generation_id, title)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, generation_id) DO NOTHING
     RETURNING *`,
    [userId, generationId, title]
  )
  return result.rows[0]
}

export const findSavedDesignsByUserId = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT sd.*, ag.type, ag.prompt, ag.output_image_url, ag.style_id, ag.created_at as generated_at
     FROM saved_designs sd
     JOIN ai_generations ag ON sd.generation_id = ag.id
     WHERE sd.user_id = $1
     ORDER BY sd.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const findFavoriteDesignsByUserId = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  const result = await pool.query(
    `SELECT sd.*, ag.type, ag.prompt, ag.output_image_url, ag.style_id, ag.created_at as generated_at
     FROM saved_designs sd
     JOIN ai_generations ag ON sd.generation_id = ag.id
     WHERE sd.user_id = $1 AND sd.is_favorite = true
     ORDER BY sd.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}

export const toggleFavorite = async (id) => {
  const result = await pool.query(
    `UPDATE saved_designs 
     SET is_favorite = NOT is_favorite 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const deleteSavedDesign = async (id) => {
  const result = await pool.query(
    'DELETE FROM saved_designs WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

export const updateSavedDesign = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    fields.push(`${snakeKey} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  if (fields.length === 0) return null

  values.push(id)

  const result = await pool.query(
    `UPDATE saved_designs 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}
