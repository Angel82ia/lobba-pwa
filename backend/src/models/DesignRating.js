import pool from '../config/database.js'

export const createRating = async ({ catalogItemId, userId, rating, comment }) => {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  try {
    const result = await pool.query(
      `INSERT INTO design_ratings (catalog_item_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [catalogItemId, userId, rating, comment]
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      return null
    }
    throw error
  }
}

export const updateRating = async (id, { rating, comment }) => {
  const updates = []
  const values = []
  let paramCount = 1

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    updates.push(`rating = $${paramCount}`)
    values.push(rating)
    paramCount++
  }

  if (comment !== undefined) {
    updates.push(`comment = $${paramCount}`)
    values.push(comment)
    paramCount++
  }

  if (updates.length === 0) {
    return null
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE design_ratings 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const findRatingsByCatalogItem = async (catalogItemId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  
  const result = await pool.query(
    `SELECT dr.*,
            u.first_name, u.last_name, u.avatar
     FROM design_ratings dr
     JOIN users u ON dr.user_id = u.id
     WHERE dr.catalog_item_id = $1
     ORDER BY dr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [catalogItemId, limit, offset]
  )
  return result.rows
}

export const findUserRating = async (catalogItemId, userId) => {
  const result = await pool.query(
    `SELECT dr.*
     FROM design_ratings dr
     WHERE dr.catalog_item_id = $1 AND dr.user_id = $2`,
    [catalogItemId, userId]
  )
  return result.rows[0]
}

export const getAverageRating = async (catalogItemId) => {
  const result = await pool.query(
    `SELECT 
       COALESCE(AVG(rating), 0) as average_rating,
       COUNT(*) as rating_count
     FROM design_ratings
     WHERE catalog_item_id = $1`,
    [catalogItemId]
  )
  return {
    averageRating: parseFloat(result.rows[0].average_rating),
    ratingCount: parseInt(result.rows[0].rating_count)
  }
}

export const getRatingDistribution = async (catalogItemId) => {
  const result = await pool.query(
    `SELECT 
       rating,
       COUNT(*) as count
     FROM design_ratings
     WHERE catalog_item_id = $1
     GROUP BY rating
     ORDER BY rating DESC`,
    [catalogItemId]
  )
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  result.rows.forEach(row => {
    distribution[row.rating] = parseInt(row.count)
  })
  
  return distribution
}
