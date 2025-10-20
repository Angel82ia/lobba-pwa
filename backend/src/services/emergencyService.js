import pool from '../config/database.js'
import logger from '../utils/logger.js'
import { canUseEmergency } from './membershipLimitsService.js'

export const recordEmergencyArticleUse = async (userId, articleType, commerceId, commerceName) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const eligibility = await canUseEmergency(userId)

    if (!eligibility.canUse) {
      throw new Error(eligibility.reason)
    }

    const membershipQuery = await client.query(
      `SELECT membership_type FROM memberships
       WHERE user_id = $1 AND status = 'active'
       LIMIT 1`,
      [userId]
    )

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found')
    }

    const membershipType = membershipQuery.rows[0].membership_type

    const result = await client.query(
      `INSERT INTO emergency_article_uses
        (user_id, membership_type, commerce_id, commerce_name, article_type, remaining_this_month)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, membershipType, commerceId, commerceName, articleType, eligibility.remaining - 1]
    )

    await client.query('COMMIT')

    const usage = result.rows[0]

    logger.info(`Emergency article (${articleType}) used by user ${userId} at ${commerceName}`)

    return {
      id: usage.id,
      articleType: usage.article_type,
      usedAt: usage.used_at,
      remainingThisMonth: usage.remaining_this_month,
      commerce: {
        id: usage.commerce_id,
        name: usage.commerce_name,
      },
    }
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error using emergency article:', error)
    throw error
  } finally {
    client.release()
  }
}

export const getEmergencyHistory = async (userId, limit = 10) => {
  try {
    const result = await pool.query(
      `SELECT * FROM emergency_article_uses
       WHERE user_id = $1
       ORDER BY used_at DESC
       LIMIT $2`,
      [userId, limit]
    )

    return result.rows.map(usage => ({
      id: usage.id,
      articleType: usage.article_type,
      usedAt: usage.used_at,
      month: usage.month,
      remainingAfterUse: usage.remaining_this_month,
      commerce: {
        id: usage.commerce_id,
        name: usage.commerce_name,
      },
    }))
  } catch (error) {
    logger.error('Error getting emergency history:', error)
    throw error
  }
}

export const getEmergencyUsageByMonth = async (userId, month) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_used,
        article_type,
        MAX(remaining_this_month) as last_remaining
       FROM emergency_article_uses
       WHERE user_id = $1 AND month = $2
       GROUP BY article_type`,
      [userId, month]
    )

    return result.rows.map(row => ({
      articleType: row.article_type,
      count: parseInt(row.total_used),
      lastRemaining: parseInt(row.last_remaining),
    }))
  } catch (error) {
    logger.error('Error getting emergency usage by month:', error)
    throw error
  }
}
