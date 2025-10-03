import pool from '../config/database.js'

const DAILY_LIMIT = 10

export const checkRateLimit = async (salonProfileId) => {
  const result = await pool.query(
    `SELECT * FROM notification_rate_limits 
     WHERE salon_profile_id = $1 AND date = CURRENT_DATE`,
    [salonProfileId]
  )

  const record = result.rows[0]
  if (!record) {
    return { allowed: true, count: 0, limit: DAILY_LIMIT }
  }

  return {
    allowed: record.count < DAILY_LIMIT,
    count: record.count,
    limit: DAILY_LIMIT,
  }
}

export const incrementRateLimit = async (salonProfileId) => {
  const result = await pool.query(
    `INSERT INTO notification_rate_limits (salon_profile_id, date, count)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (salon_profile_id, date)
     DO UPDATE SET count = notification_rate_limits.count + 1, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [salonProfileId]
  )
  return result.rows[0]
}

export const getRateLimitStats = async (salonProfileId, days = 30) => {
  const result = await pool.query(
    `SELECT date, count FROM notification_rate_limits 
     WHERE salon_profile_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY date DESC`,
    [salonProfileId]
  )
  return result.rows
}
