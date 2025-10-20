import logger from '../utils/logger.js'
import * as PowerbankLoan from '../models/PowerbankLoan.js'
import * as MembershipLimitsService from './membershipLimitsService.js'

const LOAN_DURATION_HOURS = 24

/**
 * Loan a powerbank to a user
 * @param {string} userId - User ID
 * @param {string} powerbankId - Powerbank identifier
 * @param {string} commerceId - Commerce ID where loan occurs
 * @param {string} commerceName - Commerce name
 * @returns {Promise<Object>} Loan details
 */
export const loanPowerbank = async (userId, powerbankId, commerceId, commerceName) => {
  try {
    const canLoan = await MembershipLimitsService.canLoanPowerbank(userId)

    if (!canLoan.canUse) {
      throw new Error(canLoan.reason)
    }

    const activeLoan = await PowerbankLoan.findActiveLoanByUserId(userId)

    if (activeLoan) {
      throw new Error('User already has an active powerbank loan')
    }

    const loan = await PowerbankLoan.createLoan({
      userId,
      powerbankId,
      commerceId,
      commerceName,
    })

    await MembershipLimitsService.recordPowerbankLoan(userId)

    logger.info(`Powerbank ${powerbankId} loaned to user ${userId}`)

    return {
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      deadline: new Date(new Date(loan.loan_date).getTime() + LOAN_DURATION_HOURS * 60 * 60 * 1000),
      commerce: {
        id: loan.commerce_id,
        name: loan.commerce_name,
      },
    }
  } catch (error) {
    logger.error('Error loaning powerbank:', error)
    throw error
  }
}

/**
 * Return a powerbank
 * @param {string} loanId - Loan ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Return details with penalty info
 */
export const returnPowerbank = async (loanId, userId) => {
  try {
    const existingLoan = await PowerbankLoan.findLoanByIdAndUserId(loanId, userId)

    if (!existingLoan || existingLoan.status !== 'active') {
      throw new Error('Active loan not found')
    }

    const loan = await PowerbankLoan.markAsReturned(loanId)

    logger.info(
      `Powerbank ${loan.powerbank_id} returned by user ${userId}. Penalty: ${loan.penalty_applied}`
    )

    return {
      id: loan.id,
      powerbankId: loan.powerbank_id,
      loanDate: loan.loan_date,
      returnDate: loan.return_date,
      hoursElapsed: loan.hours_elapsed,
      penaltyApplied: loan.penalty_applied,
      penaltyAmount: loan.penalty_amount,
      penaltyReason: loan.penalty_reason,
    }
  } catch (error) {
    logger.error('Error returning powerbank:', error)
    throw error
  }
}

/**
 * Get active loan for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active loan with deadline info or null
 */
export const getActiveLoan = async userId => {
  try {
    const loan = await PowerbankLoan.findActiveLoanByUserId(userId)

    if (!loan) {
      return null
    }

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
        name: loan.commerce_name,
      },
    }
  } catch (error) {
    logger.error('Error getting active loan:', error)
    throw error
  }
}

/**
 * Get loan history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Array of loans
 */
export const getLoanHistory = async (userId, limit = 10) => {
  try {
    const loans = await PowerbankLoan.findLoansByUserId(userId, limit)

    return loans.map(loan => ({
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
        name: loan.commerce_name,
      },
    }))
  } catch (error) {
    logger.error('Error getting loan history:', error)
    throw error
  }
}

/**
 * Check and mark overdue loans (cron job)
 * @returns {Promise<number>} Number of loans marked as overdue
 */
export const checkOverdueLoans = async () => {
  try {
    const overdueLoans = await PowerbankLoan.findOverdueLoans()

    for (const loan of overdueLoans) {
      await PowerbankLoan.markAsOverdue(loan.id)

      logger.warn(`Powerbank loan ${loan.id} marked as overdue for user ${loan.user_id}`)
    }

    return overdueLoans.length
  } catch (error) {
    logger.error('Error checking overdue loans:', error)
    throw error
  }
}
