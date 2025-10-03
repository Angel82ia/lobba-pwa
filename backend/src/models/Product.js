import pool from '../config/database.js'

export const createProduct = async ({
  name,
  slug,
  description,
  categoryId,
  basePrice,
  discountPercentage,
  stockQuantity,
  isNew,
  isFeatured,
}) => {
  const result = await pool.query(
    `INSERT INTO products 
     (name, slug, description, category_id, base_price, discount_percentage, stock_quantity, is_new, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      name,
      slug,
      description || null,
      categoryId || null,
      basePrice,
      discountPercentage || 0,
      stockQuantity || 0,
      isNew || false,
      isFeatured || false,
    ]
  )
  return result.rows[0]
}

export const findAllProducts = async ({
  categoryId,
  search,
  minPrice,
  maxPrice,
  isNew,
  isFeatured,
  page = 1,
  limit = 20,
  sortBy = 'created_at',
} = {}) => {
  const conditions = ['is_active = true']
  const values = []
  let paramCount = 1

  if (categoryId) {
    conditions.push(`category_id = $${paramCount}`)
    values.push(categoryId)
    paramCount++
  }

  if (search) {
    conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`)
    values.push(`%${search}%`)
    paramCount++
  }

  if (minPrice !== undefined) {
    conditions.push(`base_price >= $${paramCount}`)
    values.push(minPrice)
    paramCount++
  }

  if (maxPrice !== undefined) {
    conditions.push(`base_price <= $${paramCount}`)
    values.push(maxPrice)
    paramCount++
  }

  if (isNew !== undefined) {
    conditions.push(`is_new = $${paramCount}`)
    values.push(isNew)
    paramCount++
  }

  if (isFeatured !== undefined) {
    conditions.push(`is_featured = $${paramCount}`)
    values.push(isFeatured)
    paramCount++
  }

  const offset = (page - 1) * limit
  values.push(limit, offset)

  const query = `
    SELECT * FROM products 
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${sortBy} DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `

  const result = await pool.query(query, values)
  return result.rows
}

export const findProductById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findProductBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE slug = $1 AND is_active = true`,
    [slug]
  )
  return result.rows[0]
}

export const updateProduct = async (id, updates) => {
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
    return await findProductById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE products 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteProduct = async (id) => {
  const result = await pool.query(
    `UPDATE products 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const updateStock = async (id, quantity) => {
  const result = await pool.query(
    `UPDATE products 
     SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [quantity, id]
  )
  return result.rows[0]
}
