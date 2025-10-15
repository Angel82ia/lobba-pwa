import api from '../utils/api'

export const getReferralCode = async () => {
  try {
    const response = await api.get('/referral/code')
    return response.data
  } catch (error) {
    console.error('Error getting referral code:', error)
    throw error
  }
}

export const createReferralCampaign = async () => {
  try {
    const response = await api.post('/referral/campaign')
    return response.data
  } catch (error) {
    console.error('Error creating referral campaign:', error)
    throw error
  }
}

export const registerReferral = async (referralCode) => {
  try {
    const response = await api.post('/referral/register', { referralCode })
    return response.data
  } catch (error) {
    console.error('Error registering referral:', error)
    throw error
  }
}

export const completeReferral = async (membershipType) => {
  try {
    const response = await api.post('/referral/complete', { membershipType })
    return response.data
  } catch (error) {
    console.error('Error completing referral:', error)
    throw error
  }
}

export const getReferralStats = async () => {
  try {
    const response = await api.get('/referral/stats')
    return response.data
  } catch (error) {
    console.error('Error getting referral stats:', error)
    throw error
  }
}

export const getReferralHistory = async () => {
  try {
    const response = await api.get('/referral/history')
    return response.data
  } catch (error) {
    console.error('Error getting referral history:', error)
    throw error
  }
}
