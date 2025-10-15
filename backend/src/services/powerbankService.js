import pool from '../config/database.js'
import logger from '../utils/logger.js'

const PENALTY_AMOUNT = 10.00
const LOAN_DURATION_HOURS = 24

export const loanPowerbank = async (userId, powerbankId, commerceId, commerceName) => {
  try {
    const activeLoansQuery = await pool.query(
      `SELECT id FROM powerbank_loans
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    )
    
    if (activeLoansQuery.rows.length > 0) {
      throw new Error('User already has an active powerbank loan')
    }
    
    const result = await pool.query(
      `INSERT INTO powerbank_loans 
        (user_id, powerbank_id, commerce_id, commerce_name, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [userId, powerbankId, commerceId, commerceName]
    )
    
    const loan = result.rows[0]
    
    logger.info(`Powerbank ${powerbankId} loaned to user ${userId}`)
    
    return {
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      deadline: new Date(new Date(loan.loan_date).getTime() + LOAN_DURATION_HOURS * 60 * 60 * 1000),
      commerce: {
        id: loan.commerce_id,
        name: loan.commerce_name
      }
    }
  } catch (error) {
    logger.error('Error loaning powerbank:', error)
    throw error
  }
}

export const returnPowerbank = async (loanId, userId) => {
  try {
    const loanQuery = await pool.query(
      `SELECT * FROM powerbank_loans
       WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [loanId, userId]
    )
    
    if (loanQuery.rows.length === 0) {
      throw new Error('Active loan not found')
    }
    
    const result = await pool.query(
      `UPDATE powerbank_loans
       SET return_date = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [loanId]
    )
    
    const loan = result.rows[0]
    
    logger.info(`Powerbank ${loan.powerbank_id} returned by user ${userId}. Penalty: ${loan.penalty_applied}`)
    
    return {
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      returnDate: loan.return_date,
      hoursElapsed: loan.hours_elapsed,
      penaltyApplied: loan.penalty_applied,
      penaltyAmount: loan.penalty_amount,
      penaltyReason: loan.penalty_reason
    }
  } catch (error) {
    logger.error('Error returning powerbank:', error)
    throw error
  }
}

export const getActiveLoan = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT * FROM powerbank_loans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY loan_date DESC
       LIMIT 1`,
      [userId]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const loan = result.rows[0]
    const now = new Date()
    const loanDate = new Date(loan.loan_date)
    const deadline = new Date(loanDate.getTime() + LOAN_DURATION_HOURS * 60 * 60 * 1000)
    const hoursRemaining = Math.max(0, (deadline - now) / (1000 * 60 * 60))
    
    return {
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      deadline,
      hoursRemaining: hoursRemaining.toFixed(1),
      isOverdue: now > deadline,
      commerce: {
        id: loan.commerce_id,
        name: loan.commerce_name
      }
    }
  } catch (error) {
    logger.error('Error getting active loan:', error)
    throw error
  }
}

export const getLoanHistory = async (userId, limit = 10) => {
  try {
    const result = await pool.query(
      `SELECT * FROM powerbank_loans
       WHERE user_id = $1
       ORDER BY loan_date DESC
       LIMIT $2`,
      [userId, limit]
    )
    
    return result.rows.map(loan => ({
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      returnDate: loan.return_date,
      status: loan.status,
      hoursElapsed: loan.hours_elapsed,
      penaltyApplied: loan.penalty_applied,
      penaltyAmount: loan.penalty_amount,
      commerce: {
        id: loan.commerce_id,
        name: loan.commerce_name
      }
    }))
  } catch (error) {
    logger.error('Error getting loan history:', error)
    throw error
  }
}

export const checkOverdueLoans = async () => {
  try {
    const overdueThreshold = new Date(Date.now() - LOAN_DURATION_HOURS * 60 * 60 * 1000)
    
    const result = await pool.query(
      `SELECT * FROM powerbank_loans
       WHERE status = 'active' 
       AND loan_date < $1`,
      [overdueThreshold]
    )
    
    const overdueLoans = result.rows
    
    for (const loan of overdueLoans) {
      await pool.query(
        `UPDATE powerbank_loans
         SET status = 'overdue'
         WHERE id = $1`,
        [loan.id]
      )
      
      logger.warn(`Powerbank loan ${loan.id} marked as overdue for user ${loan.user_id}`)
    }
    
    return overdueLoans.length
  } catch (error) {
    logger.error('Error checking overdue loans:', error)
    throw error
  }
}
