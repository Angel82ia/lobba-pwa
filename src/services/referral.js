import api from './api'

export const getReferralCode = async () => {
  const response = await api.get('/referral/code')
  return response.data
}

export const createReferralCampaign = async () => {
  const response = await api.post('/referral/campaign')
  return response.data
}

export const registerReferral = async referralCode => {
  const response = await api.post('/referral/register', { referralCode })
  return response.data
}

export const completeReferral = async membershipType => {
  const response = await api.post('/referral/complete', { membershipType })
  return response.data
}

export const getReferralStats = async () => {
  const response = await api.get('/referral/stats')
  return response.data
}

export const getReferralHistory = async () => {
  const response = await api.get('/referral/history')
  return response.data
}
