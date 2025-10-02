import pool from '../config/database.js'

export const addImage = async ({
  productId,
  imageUrl,
  altText,
  isPrimary,
  sortOrder,
}) => {
  const result = await pool.query(
    `INSERT INTO product_images 
     (product_id, image_url, alt_text, is_primary, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [productId, imageUrl, altText || null, isPrimary || false, sortOrder || 0]
  )
  return result.rows[0]
}

export const findImagesByProductId = async (productId) => {
  const result = await pool.query(
    `SELECT * FROM product_images 
     WHERE product_id = $1
     ORDER BY is_primary DESC, sort_order ASC`,
    [productId]
  )
  return result.rows
}

export const deleteImage = async (id) => {
  const result = await pool.query(
    `DELETE FROM product_images WHERE id = $1 RETURNING *`,
    [id]
  )
  return result.rows[0]
}

export const setPrimaryImage = async (productId, imageId) => {
  await pool.query(
    `UPDATE product_images SET is_primary = false WHERE product_id = $1`,
    [productId]
  )
  
  const result = await pool.query(
    `UPDATE product_images SET is_primary = true WHERE id = $1 RETURNING *`,
    [imageId]
  )
  
  return result.rows[0]
}
