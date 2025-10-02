import pool from '../config/database.js'

export const createRefreshToken = async (userId, token, expiresAt) => {
  const result = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, token, expiresAt]
  )
  return result.rows[0]
}

export const findRefreshToken = async (token) => {
  const result = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
    [token]
  )
  return result.rows[0]
}

export const revokeRefreshToken = async (token) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
    [token]
  )
}

export const revokeAllUserTokens = async (userId) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
    [userId]
  )
}
