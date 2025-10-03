import pool from '../config/database.js'

export const registerToken = async ({ userId, token, deviceType }) => {
  const result = await pool.query(
    `INSERT INTO fcm_tokens (user_id, token, device_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) 
     DO UPDATE SET user_id = $1, device_type = $2, last_used_at = CURRENT_TIMESTAMP, is_active = true
     RETURNING *`,
    [userId, token, deviceType]
  )
  return result.rows[0]
}

export const findTokensByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM fcm_tokens WHERE user_id = $1 AND is_active = true',
    [userId]
  )
  return result.rows
}

export const deactivateToken = async (token) => {
  const result = await pool.query(
    'UPDATE fcm_tokens SET is_active = false WHERE token = $1 RETURNING *',
    [token]
  )
  return result.rows[0]
}

export const findTokensByUserIds = async (userIds) => {
  const result = await pool.query(
    'SELECT * FROM fcm_tokens WHERE user_id = ANY($1) AND is_active = true',
    [userIds]
  )
  return result.rows
}

export const updateLastUsed = async (token) => {
  await pool.query(
    'UPDATE fcm_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token = $1',
    [token]
  )
}

export const cleanupInactiveTokens = async (daysInactive = 90) => {
  const result = await pool.query(
    `DELETE FROM fcm_tokens 
     WHERE last_used_at < NOW() - INTERVAL '${daysInactive} days'
     RETURNING *`
  )
  return result.rows
}
