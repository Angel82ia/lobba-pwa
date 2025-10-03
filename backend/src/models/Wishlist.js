import pool from '../config/database.js'

export const addToWishlist = async (userId, productId) => {
  const result = await pool.query(
    `INSERT INTO wishlist (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING
     RETURNING *`,
    [userId, productId]
  )
  return result.rows[0]
}

export const removeFromWishlist = async (userId, productId) => {
  const result = await pool.query(
    `DELETE FROM wishlist 
     WHERE user_id = $1 AND product_id = $2
     RETURNING *`,
    [userId, productId]
  )
  return result.rows[0]
}

export const getUserWishlist = async (userId) => {
  const result = await pool.query(
    `SELECT w.*, p.name, p.slug, p.base_price, p.discount_percentage,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = $1 AND p.is_active = true
     ORDER BY w.added_at DESC`,
    [userId]
  )
  return result.rows
}

export const isInWishlist = async (userId, productId) => {
  const result = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2) as exists`,
    [userId, productId]
  )
  return result.rows[0].exists
}
