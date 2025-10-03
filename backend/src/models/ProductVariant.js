import pool from '../config/database.js'

export const createVariant = async ({
  productId,
  sku,
  name,
  color,
  size,
  priceAdjustment,
  stockQuantity,
}) => {
  const result = await pool.query(
    `INSERT INTO product_variants 
     (product_id, sku, name, color, size, price_adjustment, stock_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      productId,
      sku || null,
      name,
      color || null,
      size || null,
      priceAdjustment || 0,
      stockQuantity || 0,
    ]
  )
  return result.rows[0]
}

export const findVariantsByProductId = async (productId) => {
  const result = await pool.query(
    `SELECT * FROM product_variants 
     WHERE product_id = $1 AND is_active = true
     ORDER BY name ASC`,
    [productId]
  )
  return result.rows
}

export const findVariantById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM product_variants WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const updateVariant = async (id, updates) => {
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
    return await findVariantById(id)
  }

  values.push(id)

  const result = await pool.query(
    `UPDATE product_variants 
     SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING *`,
    values
  )

  return result.rows[0]
}

export const deleteVariant = async (id) => {
  const result = await pool.query(
    `UPDATE product_variants 
     SET is_active = false 
     WHERE id = $1 
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}
