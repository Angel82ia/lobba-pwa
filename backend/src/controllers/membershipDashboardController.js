import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'
import { getCurrentMonthLimits } from '../services/membershipLimitsService.js'
import {
  getActiveLoan,
  getLoanHistory,
  loanPowerbank,
  returnPowerbank,
} from '../services/powerbankService.js'
import { recordEmergencyArticleUse, getEmergencyHistory } from '../services/emergencyService.js'
import pool from '../config/database.js'

export const getMembershipDashboard = async (req, res) => {
  try {
    const userId = req.user.id

    const membershipQuery = await pool.query(
      `SELECT m.*, u.email, u.first_name, u.last_name
       FROM memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.user_id = $1 AND m.status = 'active'
       LIMIT 1`,
      [userId]
    )

    if (membershipQuery.rows.length === 0) {
      return res.json({
        hasMembership: false,
        message: 'No active membership found',
      })
    }

    const membership = membershipQuery.rows[0]
    const limits = await getCurrentMonthLimits(userId)
    const activeLoan = await getActiveLoan(userId)
    const loanHistory = await getLoanHistory(userId, 5)
    const emergencyHistory = await getEmergencyHistory(userId, 5)

    res.json({
      hasMembership: true,
      membership: {
        id: membership.id,
        type: membership.membership_type,
        status: membership.status,
        startDate: membership.start_date,
        nextBillingDate: membership.next_billing_date,
        monthlyPrice: membership.monthly_price,
        billingCycle: membership.billing_cycle,
      },
      user: {
        email: membership.email,
        firstName: membership.first_name,
        lastName: membership.last_name,
      },
      limits,
      powerbank: {
        active: activeLoan,
        history: loanHistory,
      },
      emergencies: {
        history: emergencyHistory,
      },
    })
  } catch (error) {
    logger.error('Get membership dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
}

export const requestPowerbankLoan = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.user.id
    const { powerbankId, commerceId, commerceName } = req.body

    const loan = await loanPowerbank(userId, powerbankId, commerceId, commerceName)

    res.json({
      success: true,
      loan,
    })
  } catch (error) {
    logger.error('Request powerbank loan error:', error)
    res.status(500).json({ error: error.message || 'Failed to loan powerbank' })
  }
}

export const completePowerbankReturn = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.user.id
    const { loanId } = req.params

    const returnInfo = await returnPowerbank(loanId, userId)

    res.json({
      success: true,
      return: returnInfo,
    })
  } catch (error) {
    logger.error('Complete powerbank return error:', error)
    res.status(500).json({ error: error.message || 'Failed to return powerbank' })
  }
}

export const requestEmergencyArticle = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = req.user.id
    const { articleType, commerceId, commerceName } = req.body

    const usage = await recordEmergencyArticleUse(userId, articleType, commerceId, commerceName)

    res.json({
      success: true,
      usage,
    })
  } catch (error) {
    logger.error('Request emergency article error:', error)
    res.status(500).json({ error: error.message || 'Failed to use emergency article' })
  }
}

export const getCurrentLimits = async (req, res) => {
  try {
    const userId = req.user.id
    const limits = await getCurrentMonthLimits(userId)

    res.json(limits)
  } catch (error) {
    logger.error('Get current limits error:', error)
    res.status(500).json({ error: 'Failed to fetch limits' })
  }
}

export const getActivePowerbank = async (req, res) => {
  try {
    const userId = req.user.id
    const activeLoan = await getActiveLoan(userId)

    res.json({
      hasActiveLoan: activeLoan !== null,
      loan: activeLoan,
    })
  } catch (error) {
    logger.error('Get active powerbank error:', error)
    res.status(500).json({ error: 'Failed to fetch active powerbank' })
  }
}

export const getDashboard = getMembershipDashboard
export const useEmergency = requestEmergencyArticle
