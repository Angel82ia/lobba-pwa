import pool from '../config/database.js'

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `LOBBA-${timestamp}-${random}`
}

export const createOrder = async ({
  userId,
  items,
  shippingMethod,
  shippingAddress,
  subtotal,
  shippingCost,
  tax,
  total,
}) => {
  const orderNumber = generateOrderNumber()

  const result = await pool.query(
    `INSERT INTO orders 
     (user_id, order_number, subtotal, shipping_cost, tax, total, shipping_method, shipping_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, orderNumber, subtotal, shippingCost, tax, total, shippingMethod, JSON.stringify(shippingAddress)]
  )

  const order = result.rows[0]

  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items 
       (order_id, product_id, variant_id, quantity, unit_price, subtotal, product_name, product_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order.id,
        item.productId,
        item.variantId || null,
        item.quantity,
        item.unitPrice,
        item.subtotal,
        item.productName,
        JSON.stringify(item.productSnapshot || {}),
      ]
    )
  }

  return order
}

export const findOrderById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE id = $1`,
    [id]
  )
  return result.rows[0]
}

export const findOrdersByUserId = async (userId, { status, page = 1, limit = 20 } = {}) => {
  const conditions = ['user_id = $1']
  const values = [userId]
  let paramCount = 2

  if (status) {
    conditions.push(`status = $${paramCount}`)
    values.push(status)
    paramCount++
  }

  const offset = (page - 1) * limit
  values.push(limit, offset)

  const query = `
    SELECT * FROM orders 
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `

  const result = await pool.query(query, values)
  return result.rows
}

export const updateOrderStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE orders 
     SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [status, id]
  )
  return result.rows[0]
}

export const updateTrackingNumber = async (id, trackingNumber) => {
  const result = await pool.query(
    `UPDATE orders 
     SET tracking_number = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [trackingNumber, id]
  )
  return result.rows[0]
}

export const updateStripePaymentIntent = async (id, paymentIntentId, paymentStatus) => {
  const result = await pool.query(
    `UPDATE orders 
     SET stripe_payment_intent_id = $1, stripe_payment_status = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *`,
    [paymentIntentId, paymentStatus, id]
  )
  return result.rows[0]
}

export const findOrderByPaymentIntent = async (paymentIntentId) => {
  const result = await pool.query(
    'SELECT * FROM orders WHERE stripe_payment_intent_id = $1',
    [paymentIntentId]
  )
  return result.rows[0]
}
