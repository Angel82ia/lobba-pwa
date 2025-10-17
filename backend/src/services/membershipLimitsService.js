import pool from '../config/database.js';
import logger from '../utils/logger.js';
import * as MonthlyLimit from '../models/MonthlyLimit.js';

const MEMBERSHIP_LIMITS = {
  essential: {
    emergencyArticles: 2,
    powerbanks: 2,
    nailPrints: 100,
    emsSessions: 0,
    monthlyShipments: 1,
  },
  spirit: {
    emergencyArticles: 4,
    powerbanks: 4,
    nailPrints: 100,
    emsSessions: 2,
    monthlyShipments: 2,
  },
};

/**
 * Get current month limits and usage for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Limits and usage data
 */
export const getCurrentMonthLimits = async (userId) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const membershipQuery = await pool.query(
      `SELECT m.id, m.plan_type, m.status 
       FROM memberships m
       WHERE m.user_id = $1 AND m.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      return {
        hasMembership: false,
        membershipType: null,
        month: currentMonth,
        emergencies: { used: 0, limit: 0, remaining: 0 },
        powerbanks: { used: 0, limit: 0, remaining: 0 },
        nailPrints: { used: 0, limit: 0, remaining: 0 },
        emsSessions: { used: 0, limit: 0, remaining: 0 },
        shipments: { used: 0, limit: 0, remaining: 0 },
      };
    }

    const membership = membershipQuery.rows[0];
    const membershipType = membership.plan_type;
    const limits = MEMBERSHIP_LIMITS[membershipType];

    let monthlyLimits = await MonthlyLimit.getCurrentMonthLimits(membership.id);

    if (!monthlyLimits) {
      monthlyLimits = await MonthlyLimit.createMonthlyLimits(membership.id, membershipType);
    }

    return {
      hasMembership: true,
      membershipType,
      month: currentMonth,
      emergencies: {
        used: monthlyLimits.emergency_articles_used,
        limit: monthlyLimits.emergency_articles,
        remaining: Math.max(0, monthlyLimits.emergency_articles - monthlyLimits.emergency_articles_used),
      },
      powerbanks: {
        used: monthlyLimits.powerbanks_used,
        limit: monthlyLimits.powerbanks,
        remaining: Math.max(0, monthlyLimits.powerbanks - monthlyLimits.powerbanks_used),
      },
      nailPrints: {
        used: monthlyLimits.nail_prints_used,
        limit: monthlyLimits.nail_prints,
        remaining: Math.max(0, monthlyLimits.nail_prints - monthlyLimits.nail_prints_used),
      },
      emsSessions: {
        used: monthlyLimits.ems_sessions_used,
        limit: monthlyLimits.ems_sessions,
        remaining: Math.max(0, monthlyLimits.ems_sessions - monthlyLimits.ems_sessions_used),
      },
      shipments: {
        used: 0,
        limit: limits.monthlyShipments,
        remaining: limits.monthlyShipments,
      },
    };
  } catch (error) {
    logger.error('Error getting monthly limits:', error);
    throw error;
  }
}

/**
 * Check if user can use emergency article
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { canUse: boolean, reason?: string, remaining?: number }
 */
export const canUseEmergency = async (userId) => {
  try {
    const limits = await getCurrentMonthLimits(userId);

    if (!limits.hasMembership) {
      return { canUse: false, reason: 'No active membership' };
    }

    if (limits.emergencies.remaining <= 0) {
      return { canUse: false, reason: 'Monthly emergency article limit reached' };
    }

    return { canUse: true, remaining: limits.emergencies.remaining };
  } catch (error) {
    logger.error('Error checking emergency availability:', error);
    throw error;
  }
};

/**
 * Check if user can loan a powerbank
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { canUse: boolean, reason?: string, remaining?: number }
 */
export const canLoanPowerbank = async (userId) => {
  try {
    const limits = await getCurrentMonthLimits(userId);

    if (!limits.hasMembership) {
      return { canUse: false, reason: 'No active membership' };
    }

    if (limits.powerbanks.remaining <= 0) {
      return { canUse: false, reason: 'Monthly powerbank loan limit reached' };
    }

    const activeLoanQuery = await pool.query(
      `SELECT COUNT(*) as active_loans
       FROM powerbank_loans
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const activeLoans = parseInt(activeLoanQuery.rows[0].active_loans) || 0;

    if (activeLoans > 0) {
      return { canUse: false, reason: 'You already have an active powerbank loan' };
    }

    return { canUse: true, remaining: limits.powerbanks.remaining };
  } catch (error) {
    logger.error('Error checking powerbank availability:', error);
    throw error;
  }
};

/**
 * Check if user can use nail print service
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { canUse: boolean, reason?: string, remaining?: number }
 */
export const canUseNailPrint = async (userId) => {
  try {
    const limits = await getCurrentMonthLimits(userId);

    if (!limits.hasMembership) {
      return { canUse: false, reason: 'No active membership' };
    }

    if (limits.nailPrints.remaining <= 0) {
      return { canUse: false, reason: 'Monthly nail print limit reached' };
    }

    return { canUse: true, remaining: limits.nailPrints.remaining };
  } catch (error) {
    logger.error('Error checking nail print availability:', error);
    throw error;
  }
};

/**
 * Check if user can book EMS session
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { canUse: boolean, reason?: string, remaining?: number }
 */
export const canUseEMS = async (userId) => {
  try {
    const limits = await getCurrentMonthLimits(userId);

    if (!limits.hasMembership) {
      return { canUse: false, reason: 'No active membership' };
    }

    if (limits.membershipType === 'essential') {
      return { canUse: false, reason: 'EMS sessions require Spirit membership' };
    }

    if (limits.emsSessions.remaining <= 0) {
      return { canUse: false, reason: 'Monthly EMS session limit reached' };
    }

    return { canUse: true, remaining: limits.emsSessions.remaining };
  } catch (error) {
    logger.error('Error checking EMS availability:', error);
    throw error;
  }
};

/**
 * Record emergency article usage
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated limits
 */
export const recordEmergencyUse = async (userId) => {
  try {
    const membershipQuery = await pool.query(
      `SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found');
    }

    const membershipId = membershipQuery.rows[0].id;
    const updated = await MonthlyLimit.incrementUsage(membershipId, 'emergency_articles_used');

    logger.info(`Emergency article used by user ${userId}. New count: ${updated.emergency_articles_used}`);

    return updated;
  } catch (error) {
    logger.error('Error recording emergency use:', error);
    throw error;
  }
};

/**
 * Record powerbank loan
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated limits
 */
export const recordPowerbankLoan = async (userId) => {
  try {
    const membershipQuery = await pool.query(
      `SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found');
    }

    const membershipId = membershipQuery.rows[0].id;
    const updated = await MonthlyLimit.incrementUsage(membershipId, 'powerbanks_used');

    logger.info(`Powerbank loaned to user ${userId}. New count: ${updated.powerbanks_used}`);

    return updated;
  } catch (error) {
    logger.error('Error recording powerbank loan:', error);
    throw error;
  }
};

/**
 * Record nail print usage
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated limits
 */
export const recordNailPrintUse = async (userId) => {
  try {
    const membershipQuery = await pool.query(
      `SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found');
    }

    const membershipId = membershipQuery.rows[0].id;
    const updated = await MonthlyLimit.incrementUsage(membershipId, 'nail_prints_used');

    logger.info(`Nail print used by user ${userId}. New count: ${updated.nail_prints_used}`);

    return updated;
  } catch (error) {
    logger.error('Error recording nail print use:', error);
    throw error;
  }
};

/**
 * Record EMS session
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated limits
 */
export const recordEMSSession = async (userId) => {
  try {
    const membershipQuery = await pool.query(
      `SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found');
    }

    const membershipId = membershipQuery.rows[0].id;
    const updated = await MonthlyLimit.incrementUsage(membershipId, 'ems_sessions_used');

    logger.info(`EMS session used by user ${userId}. New count: ${updated.ems_sessions_used}`);

    return updated;
  } catch (error) {
    logger.error('Error recording EMS session:', error);
    throw error;
  }
};

/**
 * Get membership limits for a specific plan type
 * @param {string} membershipType - 'essential' or 'spirit'
 * @returns {Object} Limits configuration
 */
export const getMembershipLimits = (membershipType) => {
  return MEMBERSHIP_LIMITS[membershipType] || null;
};

/**
 * Reset monthly limits for a user (called by cron job)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Reset limits
 */
export const resetUserMonthlyLimits = async (userId) => {
  try {
    const membershipQuery = await pool.query(
      `SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (membershipQuery.rows.length === 0) {
      throw new Error('No active membership found');
    }

    const membershipId = membershipQuery.rows[0].id;
    const reset = await MonthlyLimit.resetMonthlyLimits(membershipId);

    logger.info(`Monthly limits reset for user ${userId}`);

    return reset;
  } catch (error) {
    logger.error('Error resetting monthly limits:', error);
    throw error;
  }
};
