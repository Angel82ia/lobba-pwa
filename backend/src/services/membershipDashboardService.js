import pool from '../config/database.js'

export const getMembershipDashboard = async (userId) => {
  const membership = await pool.query(
    `SELECT * FROM memberships WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )

  if (membership.rows.length === 0) {
    return { hasMembership: false }
  }

  const mem = membership.rows[0]

  const limits = await pool.query(
    `SELECT * FROM monthly_limits WHERE membership_id = $1 AND month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
    [mem.id]
  )

  const shipments = await pool.query(
    `SELECT * FROM monthly_shipments WHERE membership_id = $1 ORDER BY shipment_date DESC LIMIT 5`,
    [mem.id]
  )

  const powerbanks = await pool.query(
    `SELECT * FROM powerbank_loans WHERE membership_id = $1 AND status = 'active'`,
    [mem.id]
  )

  const emergencies = await pool.query(
    `SELECT * FROM emergency_article_uses WHERE membership_id = $1 ORDER BY used_at DESC LIMIT 5`,
    [mem.id]
  )

  return {
    hasMembership: true,
    membership: mem,
    limits: limits.rows[0] || null,
    recentShipments: shipments.rows,
    activePowerbanks: powerbanks.rows,
    recentEmergencies: emergencies.rows
  }
}

export const useEmergencyArticle = async (userId, articleType) => {
  const membership = await pool.query(
    `SELECT * FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId]
  )

  if (membership.rows.length === 0) {
    throw new Error('No active membership')
  }

  const mem = membership.rows[0]
  const maxEmergencies = mem.membership_type === 'spirit' ? 3 : 1

  let limits = await pool.query(
    `SELECT * FROM monthly_limits WHERE membership_id = $1 AND month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
    [mem.id]
  )

  if (limits.rows.length === 0) {
    await pool.query(
      `INSERT INTO monthly_limits (membership_id, month, year, max_emergencies, emergencies_used) VALUES ($1, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $2, 0)`,
      [mem.id, maxEmergencies]
    )
    limits = await pool.query(
      `SELECT * FROM monthly_limits WHERE membership_id = $1 AND month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [mem.id]
    )
  }

  const limit = limits.rows[0]

  if (limit.emergencies_used >= limit.max_emergencies) {
    throw new Error('Monthly emergency limit reached')
  }

  await pool.query(
    `INSERT INTO emergency_article_uses (membership_id, article_type, used_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [mem.id, articleType]
  )

  await pool.query(
    `UPDATE monthly_limits SET emergencies_used = emergencies_used + 1 WHERE id = $1`,
    [limit.id]
  )

  return { success: true }
}
