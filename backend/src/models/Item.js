import pool from '../config/database.js'

export const createItem = async ({ 
  name, 
  description, 
  category, 
  imageUrl, 
  isConsumable = true, 
  stockQuantity = 0,
  monthlyLimit = 1 
}) => {
  const result = await pool.query(
    `INSERT INTO items (name, description, category, image_url, is_consumable, stock_quantity, monthly_limit)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description, category, imageUrl, isConsumable, stockQuantity, monthlyLimit]
  )
  return result.rows[0]
}

export const findItemById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM items WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findAllItems = async ({ page = 1, limit = 50, category = null, isActive = true } = {}) => {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM items WHERE 1=1'
  const params = []
  let paramCount = 1

  if (isActive !== null) {
    query += ` AND is_active = $${paramCount}`
    params.push(isActive)
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

export const updateItem = async (id, updates) => {
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
    return await findItemById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE items 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteItem = async (id) => {
  const result = await pool.query(
    `UPDATE items 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const updateStock = async (id, quantity) => {
  const result = await pool.query(
    `UPDATE items 
     SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [quantity, id]
  )
  return result.rows[0]
}

export const checkStock = async (id) => {
  const result = await pool.query(
    'SELECT stock_quantity FROM items WHERE id = $1',
    [id]
  )
  return result.rows[0]?.stock_quantity || 0
}
