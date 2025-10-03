import pool from '../config/database.js'

export const findOrCreateCart = async (userId) => {
  let result = await pool.query(
    `SELECT * FROM carts WHERE user_id = $1`,
    [userId]
  )

  if (result.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING *`,
      [userId]
    )
  }

  return result.rows[0]
}

export const addItemToCart = async ({ cartId, productId, variantId, quantity }) => {
  const existing = await pool.query(
    `SELECT * FROM cart_items 
     WHERE cart_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))`,
    [cartId, productId, variantId || null]
  )

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE cart_items 
       SET quantity = quantity + $1 
       WHERE id = $2 
       RETURNING *`,
      [quantity, existing.rows[0].id]
    )
    return result.rows[0]
  }

  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cartId, productId, variantId || null, quantity]
  )
  return result.rows[0]
}

export const getCartWithItems = async (cartId) => {
  const cart = await pool.query(
    `SELECT * FROM carts WHERE id = $1`,
    [cartId]
  )

  const items = await pool.query(
    `SELECT ci.*, p.name as product_name, p.base_price, p.discount_percentage, p.brand,
            pv.name as variant_name, pv.price_adjustment,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     LEFT JOIN product_variants pv ON ci.variant_id = pv.id
     WHERE ci.cart_id = $1
     ORDER BY ci.added_at DESC`,
    [cartId]
  )

  return {
    ...cart.rows[0],
    items: items.rows,
  }
}

export const updateCartItem = async (cartItemId, quantity) => {
  const result = await pool.query(
    `UPDATE cart_items 
     SET quantity = $1 
     WHERE id = $2 
     RETURNING *`,
    [quantity, cartItemId]
  )
  return result.rows[0]
}

export const removeItemFromCart = async (cartItemId) => {
  const result = await pool.query(
    `DELETE FROM cart_items WHERE id = $1 RETURNING *`,
    [cartItemId]
  )
  return result.rows[0]
}

export const clearCart = async (cartId) => {
  await pool.query(
    `DELETE FROM cart_items WHERE cart_id = $1`,
    [cartId]
  )
}
