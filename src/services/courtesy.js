import apiClient from './api'

export const getMembershipDashboard = async () => {
  const response = await apiClient.get('/courtesy/dashboard')
  return response.data
}

export const getCurrentLimits = async () => {
  const response = await apiClient.get('/courtesy/limits')
  return response.data
}

export const requestPowerbankLoan = async (powerbankId, commerceId, commerceName) => {
  const response = await apiClient.post('/courtesy/powerbank/loan', {
    powerbankId,
    commerceId,
    commerceName
  })
  return response.data
}

export const returnPowerbank = async (loanId) => {
  const response = await apiClient.post(`/courtesy/powerbank/${loanId}/return`)
  return response.data
}

export const getActivePowerbank = async () => {
  const response = await apiClient.get('/courtesy/powerbank/active')
  return response.data
}

export const requestEmergencyArticle = async (articleType, commerceId, commerceName) => {
  const response = await apiClient.post('/courtesy/emergency', {
    articleType,
    commerceId,
    commerceName
  })
  return response.data
}
