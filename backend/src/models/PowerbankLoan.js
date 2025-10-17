import pool from '../config/database.js';

/**
 * Create a new powerbank loan
 * @param {Object} loanData - Loan data
 * @returns {Promise<Object>} Created loan
 */
export const createLoan = async ({ userId, powerbankId, commerceId, commerceName }) => {
  const result = await pool.query(
    `INSERT INTO powerbank_loans 
      (user_id, powerbank_id, commerce_id, commerce_name, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING *`,
    [userId, powerbankId, commerceId, commerceName]
  );
  return result.rows[0];
};

/**
 * Find active loan by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active loan or null
 */
export const findActiveLoanByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans
     WHERE user_id = $1 AND status = 'active'
     ORDER BY loan_date DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Find loan by ID
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object|null>} Loan or null
 */
export const findLoanById = async (loanId) => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans WHERE id = $1`,
    [loanId]
  );
  return result.rows[0] || null;
};

/**
 * Find loan by ID and user ID
 * @param {string} loanId - Loan ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Loan or null
 */
export const findLoanByIdAndUserId = async (loanId, userId) => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans
     WHERE id = $1 AND user_id = $2`,
    [loanId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Mark powerbank as returned
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object>} Updated loan with penalty info
 */
export const markAsReturned = async (loanId) => {
  const result = await pool.query(
    `UPDATE powerbank_loans
     SET return_date = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [loanId]
  );
  return result.rows[0];
};

/**
 * Get user loan history
 * @param {string} userId - User ID
 * @param {number} limit - Max number of results
 * @returns {Promise<Array>} Array of loans
 */
export const findLoansByUserId = async (userId, limit = 10) => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans
     WHERE user_id = $1
     ORDER BY loan_date DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

/**
 * Find all active loans
 * @returns {Promise<Array>} Array of active loans
 */
export const findAllActiveLoans = async () => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans
     WHERE status = 'active'
     ORDER BY loan_date ASC`
  );
  return result.rows;
};

/**
 * Find overdue loans (active loans older than 24h)
 * @returns {Promise<Array>} Array of overdue loans
 */
export const findOverdueLoans = async () => {
  const result = await pool.query(
    `SELECT * FROM powerbank_loans
     WHERE status = 'active' 
     AND loan_date < NOW() - INTERVAL '24 hours'
     ORDER BY loan_date ASC`
  );
  return result.rows;
};

/**
 * Mark loan as overdue
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object>} Updated loan
 */
export const markAsOverdue = async (loanId) => {
  const result = await pool.query(
    `UPDATE powerbank_loans
     SET status = 'overdue'
     WHERE id = $1
     RETURNING *`,
    [loanId]
  );
  return result.rows[0];
};

/**
 * Mark loan as lost
 * @param {string} loanId - Loan ID
 * @param {number} penaltyAmount - Penalty amount
 * @param {string} penaltyReason - Reason for penalty
 * @returns {Promise<Object>} Updated loan
 */
export const markAsLost = async (loanId, penaltyAmount, penaltyReason) => {
  const result = await pool.query(
    `UPDATE powerbank_loans
     SET status = 'lost',
         penalty_applied = true,
         penalty_amount = $2,
         penalty_reason = $3
     WHERE id = $1
     RETURNING *`,
    [loanId, penaltyAmount, penaltyReason]
  );
  return result.rows[0];
};

/**
 * Add notification record to loan
 * @param {string} loanId - Loan ID
 * @param {string} notificationType - Type of notification
 * @returns {Promise<Object>} Updated loan
 */
export const addNotification = async (loanId, notificationType) => {
  const result = await pool.query(
    `UPDATE powerbank_loans
     SET notifications_sent = notifications_sent || $2::jsonb
     WHERE id = $1
     RETURNING *`,
    [loanId, JSON.stringify({ type: notificationType, sentAt: new Date().toISOString() })]
  );
  return result.rows[0];
};

/**
 * Count active loans for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of active loans
 */
export const countActiveLoans = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM powerbank_loans
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  return parseInt(result.rows[0].count) || 0;
};
