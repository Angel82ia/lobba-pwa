import * as referralService from '../services/referralService.js'
import logger from '../utils/logger.js'

export const getReferralCode = async (req, res) => {
  try {
    const userId = req.user.id
    
    const referralCode = await referralService.getUserReferralCode(userId)
    
    res.json({
      success: true,
      referralCode
    })
  } catch (error) {
    logger.error('Error getting referral code:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting referral code'
    })
  }
}

export const createCampaign = async (req, res) => {
  try {
    const userId = req.user.id
    
    const result = await referralService.createReferralCampaign(userId)
    
    res.json({
      success: true,
      campaignId: result.campaignId,
      existing: result.existing
    })
  } catch (error) {
    logger.error('Error creating campaign:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating campaign'
    })
  }
}

export const registerReferral = async (req, res) => {
  try {
    const { referralCode } = req.body
    const referredUserId = req.user.id
    
    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      })
    }
    
    const result = await referralService.registerReferral(referredUserId, referralCode)
    
    res.json({
      success: true,
      message: 'Referral registered successfully',
      hostUserId: result.hostUserId,
      campaignId: result.campaignId
    })
  } catch (error) {
    logger.error('Error registering referral:', error)
    
    if (error.message === 'Invalid referral code') {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral code'
      })
    }
    
    if (error.message === 'Cannot refer yourself') {
      return res.status(400).json({
        success: false,
        message: 'You cannot use your own referral code'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error registering referral'
    })
  }
}

export const completeReferral = async (req, res) => {
  try {
    const { membershipType } = req.body
    const referredUserId = req.user.id
    
    if (!membershipType || !['essential', 'spirit'].includes(membershipType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid membership type is required (essential or spirit)'
      })
    }
    
    const result = await referralService.completeReferralEntry(referredUserId, membershipType)
    
    res.json({
      success: true,
      message: 'Referral completed successfully',
      completedReferrals: result.completedReferrals,
      needsMore: result.needsMore
    })
  } catch (error) {
    logger.error('Error completing referral:', error)
    
    if (error.message === 'No pending referral entry found') {
      return res.status(404).json({
        success: false,
        message: 'No pending referral found'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error completing referral'
    })
  }
}

export const getStats = async (req, res) => {
  try {
    const userId = req.user.id
    
    const stats = await referralService.getReferralStats(userId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error getting referral stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting referral stats'
    })
  }
}

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id
    
    const history = await referralService.getReferralHistory(userId)
    
    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    logger.error('Error getting referral history:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting referral history'
    })
  }
}
