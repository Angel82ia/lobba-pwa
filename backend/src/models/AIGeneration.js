import pool from '../config/database.js'

export const createGeneration = async ({
  userId,
  type,
  prompt,
  inputImageUrl,
  outputImageUrl,
  styleId,
  aiProvider,
  generationTimeMs,
}) => {
  const result = await pool.query(
    `INSERT INTO ai_generations 
     (user_id, type, prompt, input_image_url, output_image_url, style_id, ai_provider, generation_time_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, type, prompt, inputImageUrl, outputImageUrl, styleId, aiProvider, generationTimeMs]
  )
  return result.rows[0]
}

export const findGenerationById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM ai_generations WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findGenerationsByUserId = async (userId, { type, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM ai_generations WHERE user_id = $1'
  const params = [userId]

  if (type) {
    query += ' AND type = $2'
    params.push(type)
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const findRecentGenerations = async ({ type, page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM ai_generations WHERE 1=1'
  const params = []

  if (type) {
    params.push(type)
    query += ' AND type = $1'
  }

  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const deleteGeneration = async (id) => {
  const result = await pool.query(
    'DELETE FROM ai_generations WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}
