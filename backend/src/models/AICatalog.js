import pool from '../config/database.js'

export const createCatalogItem = async ({
  type,
  styleId,
  name,
  description,
  previewImageUrl,
  tags,
}) => {
  const result = await pool.query(
    `INSERT INTO ai_catalog 
     (type, style_id, name, description, preview_image_url, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [type, styleId, name, description, previewImageUrl, tags]
  )
  return result.rows[0]
}

export const findCatalogItemById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM ai_catalog WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findCatalogItemByStyleId = async (styleId) => {
  const result = await pool.query(
    'SELECT * FROM ai_catalog WHERE style_id = $1',
    [styleId]
  )
  return result.rows[0]
}

export const findCatalogItems = async ({ type, tags, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM ai_catalog WHERE is_active = true'
  const params = []

  if (type) {
    params.push(type)
    query += ' AND type = $' + params.length
  }

  if (tags && tags.length > 0) {
    params.push(tags)
    query += ' AND tags && $' + params.length
  }

  query += ' ORDER BY likes_count DESC, created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows
}

export const incrementLikes = async (id) => {
  const result = await pool.query(
    `UPDATE ai_catalog 
     SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const updateCatalogItem = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    fields.push(`${snakeKey} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  if (fields.length === 0) return await findCatalogItemById(id)

  values.push(id)

  const result = await pool.query(
    `UPDATE ai_catalog 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteCatalogItem = async (id) => {
  const result = await pool.query(
    'DELETE FROM ai_catalog WHERE id = $1 RETURNING *',
    [id]
  )
  return result.rows[0]
}

export const findPublicCatalog = async ({ type, tags, page = 1, limit = 20, sortBy = 'recent' } = {}) => {
  const offset = (page - 1) * limit
  let query = `
    SELECT ac.*,
           COALESCE(AVG(dr.rating), 0) as average_rating,
           COUNT(DISTINCT dr.id) as rating_count
    FROM ai_catalog ac
    LEFT JOIN design_ratings dr ON ac.id = dr.catalog_item_id
    WHERE ac.is_active = true
  `
  const params = []

  if (type) {
    params.push(type)
    query += ' AND ac.type = $' + params.length
  }

  if (tags && tags.length > 0) {
    params.push(tags)
    query += ' AND ac.tags && $' + params.length
  }

  query += ' GROUP BY ac.id'

  if (sortBy === 'popular') {
    query += ' ORDER BY ac.likes_count DESC, ac.created_at DESC'
  } else if (sortBy === 'top_rated') {
    query += ' ORDER BY AVG(dr.rating) DESC NULLS LAST, ac.created_at DESC'
  } else {
    query += ' ORDER BY ac.created_at DESC'
  }

  query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
  params.push(limit, offset)

  const result = await pool.query(query, params)
  return result.rows.map(row => ({
    ...row,
    average_rating: parseFloat(row.average_rating),
    rating_count: parseInt(row.rating_count)
  }))
}

export const togglePublicStatus = async (id) => {
  const result = await pool.query(
    `UPDATE ai_catalog 
     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
