import pool from '../config/database.js'

export const createMembership = async ({ userId, planType, expiryDate, paymentMethod, stripeSubscriptionId, stripeCustomerId, pricePaid, currency = 'EUR' }) => {
  const result = await pool.query(
    `INSERT INTO memberships (user_id, plan_type, status, expiry_date, payment_method, stripe_subscription_id, stripe_customer_id, price_paid, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, planType, 'active', expiryDate, paymentMethod, stripeSubscriptionId, stripeCustomerId, pricePaid, currency]
  )
  return result.rows[0]
}

export const findMembershipById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM memberships WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findActiveMembershipByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM memberships 
     WHERE user_id = $1 AND status = 'active' 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  )
  return result.rows[0]
}

export const findMembershipsByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM memberships WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  return result.rows
}

export const updateMembership = async (id, updates) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramCount}`)
    values.push(value)
    paramCount++
  })

  values.push(id)
  
  const result = await pool.query(
    `UPDATE memberships SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  )
  return result.rows[0]
}

export const cancelMembership = async (id) => {
  const result = await pool.query(
    `UPDATE memberships SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  )
  return result.rows[0]
}
