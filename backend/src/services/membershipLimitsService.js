import pool from '../config/database.js'
import logger from '../utils/logger.js'

const MEMBERSHIP_LIMITS = {
  essential: {
    emergencyArticles: 2,
    monthlyShipments: 1
  },
  spirit: {
    emergencyArticles: 4,
    monthlyShipments: 2
  }
}

export const getCurrentMonthLimits = async (userId) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7)
    
    const membershipQuery = await pool.query(
      `SELECT membership_type, status 
       FROM memberships 
       WHERE user_id = $1 AND status = 'active'
       LIMIT 1`,
      [userId]
    )
    
    if (membershipQuery.rows.length === 0) {
      return {
        hasMembership: false,
        membershipType: null,
        emergencies: { used: 0, limit: 0, remaining: 0 },
        shipments: { used: 0, limit: 0, remaining: 0 }
      }
    }
    
    const membershipType = membershipQuery.rows[0].membership_type
    const limits = MEMBERSHIP_LIMITS[membershipType]
    
    const emergenciesQuery = await pool.query(
      `SELECT COUNT(*) as used
       FROM emergency_article_uses
       WHERE user_id = $1 AND month = $2`,
      [userId, currentMonth]
    )
    
    const emergenciesUsed = parseInt(emergenciesQuery.rows[0].used) || 0
    
    return {
      hasMembership: true,
      membershipType,
      month: currentMonth,
      emergencies: {
        used: emergenciesUsed,
        limit: limits.emergencyArticles,
        remaining: Math.max(0, limits.emergencyArticles - emergenciesUsed)
      },
      shipments: {
        used: 0,
        limit: limits.monthlyShipments,
        remaining: limits.monthlyShipments
      }
    }
  } catch (error) {
    logger.error('Error getting monthly limits:', error)
    throw error
  }
}

export const canUseEmergency = async (userId) => {
  try {
    const limits = await getCurrentMonthLimits(userId)
    
    if (!limits.hasMembership) {
      return { canUse: false, reason: 'No active membership' }
    }
    
    if (limits.emergencies.remaining <= 0) {
      return { canUse: false, reason: 'Monthly limit reached' }
    }
    
    return { canUse: true, remaining: limits.emergencies.remaining }
  } catch (error) {
    logger.error('Error checking emergency availability:', error)
    throw error
  }
}

export const getMembershipLimits = (membershipType) => {
  return MEMBERSHIP_LIMITS[membershipType] || null
}
