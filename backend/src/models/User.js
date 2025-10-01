import pool from '../config/database.js'

export const createUser = async ({ email, passwordHash, firstName, lastName, role, googleId, appleId }) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, google_id, apple_id, membership_active, membership_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, email, first_name, last_name, role, membership_active, membership_status, created_at`,
    [email, passwordHash, firstName, lastName, role, googleId, appleId, role === 'user', role === 'user' ? 'active' : 'expired']
  )
  return result.rows[0]
}

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )
  return result.rows[0]
}

export const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, first_name, last_name, role, membership_active, membership_status, avatar, bio, created_at FROM users WHERE id = $1',
    [id]
  )
  return result.rows[0]
}

export const findUserByGoogleId = async (googleId) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  )
  return result.rows[0]
}

export const findUserByAppleId = async (appleId) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE apple_id = $1',
    [appleId]
  )
  return result.rows[0]
}

export const updateUser = async (id, updates) => {
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
    `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  )
  return result.rows[0]
}
