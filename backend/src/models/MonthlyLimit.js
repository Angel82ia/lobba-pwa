import pool from '../config/database.js';

/**
 * Get current month limits for a membership
 * @param {string} membershipId - UUID of the membership
 * @returns {Promise<Object>} Monthly limits object
 */
export const getCurrentMonthLimits = async (membershipId) => {
  const result = await pool.query(
    `SELECT 
      id,
      membership_id,
      emergency_articles,
      emergency_articles_used,
      powerbanks,
      powerbanks_used,
      nail_prints,
      nail_prints_used,
      ems_sessions,
      ems_sessions_used,
      last_reset_date,
      created_at,
      updated_at
    FROM monthly_limits 
    WHERE membership_id = $1`,
    [membershipId]
  );
  return result.rows[0];
};

/**
 * Get monthly limits by user ID (joins with memberships table)
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} Monthly limits object with membership info
 */
export const getMonthlyLimitsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT 
      ml.*,
      m.plan_type,
      m.status as membership_status
    FROM monthly_limits ml
    INNER JOIN memberships m ON ml.membership_id = m.id
    WHERE m.user_id = $1 AND m.status = 'active'`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Create monthly limits for a membership
 * @param {string} membershipId - UUID of the membership
 * @param {string} planType - 'essential' or 'spirit'
 * @returns {Promise<Object>} Created monthly limits object
 */
export const createMonthlyLimits = async (membershipId, planType) => {
  const limits = {
    emergency_articles: planType === 'spirit' ? 4 : 2,
    powerbanks: planType === 'spirit' ? 4 : 2,
    nail_prints: 100,
    ems_sessions: planType === 'spirit' ? 2 : 0,
  };

  const result = await pool.query(
    `INSERT INTO monthly_limits (
      membership_id,
      emergency_articles,
      emergency_articles_used,
      powerbanks,
      powerbanks_used,
      nail_prints,
      nail_prints_used,
      ems_sessions,
      ems_sessions_used,
      last_reset_date
    ) VALUES ($1, $2, 0, $3, 0, $4, 0, $5, 0, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      membershipId,
      limits.emergency_articles,
      limits.powerbanks,
      limits.nail_prints,
      limits.ems_sessions,
    ]
  );
  return result.rows[0];
};

/**
 * Update monthly limits usage
 * @param {string} membershipId - UUID of the membership
 * @param {Object} updates - Object with fields to update (e.g., { emergency_articles_used: 1 })
 * @returns {Promise<Object>} Updated monthly limits object
 */
export const updateMonthlyLimits = async (membershipId, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramCount}`);
    values.push(value);
    paramCount++;
  });

  values.push(membershipId);

  const result = await pool.query(
    `UPDATE monthly_limits 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE membership_id = $${paramCount} 
    RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Increment usage counter for a specific limit
 * @param {string} membershipId - UUID of the membership
 * @param {string} limitType - 'emergency_articles_used', 'powerbanks_used', 'nail_prints_used', 'ems_sessions_used'
 * @returns {Promise<Object>} Updated monthly limits object
 */
export const incrementUsage = async (membershipId, limitType) => {
  const result = await pool.query(
    `UPDATE monthly_limits 
    SET ${limitType} = ${limitType} + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE membership_id = $1 
    RETURNING *`,
    [membershipId]
  );
  return result.rows[0];
};

/**
 * Reset monthly limits (called at start of new month)
 * @param {string} membershipId - UUID of the membership
 * @returns {Promise<Object>} Reset monthly limits object
 */
export const resetMonthlyLimits = async (membershipId) => {
  const result = await pool.query(
    `UPDATE monthly_limits 
    SET 
      emergency_articles_used = 0,
      powerbanks_used = 0,
      nail_prints_used = 0,
      ems_sessions_used = 0,
      last_reset_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE membership_id = $1 
    RETURNING *`,
    [membershipId]
  );
  return result.rows[0];
};

/**
 * Check if a specific limit can be used
 * @param {string} membershipId - UUID of the membership
 * @param {string} limitType - 'emergency_articles', 'powerbanks', 'nail_prints', 'ems_sessions'
 * @returns {Promise<boolean>} True if limit is available
 */
export const canUseLimit = async (membershipId, limitType) => {
  const usedType = `${limitType}_used`;
  
  const result = await pool.query(
    `SELECT ${limitType}, ${usedType}
    FROM monthly_limits 
    WHERE membership_id = $1`,
    [membershipId]
  );

  if (!result.rows[0]) {
    return false;
  }

  const limit = result.rows[0][limitType];
  const used = result.rows[0][usedType];

  return used < limit;
};
