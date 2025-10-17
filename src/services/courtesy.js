import apiClient from './api'

export const getMembershipDashboard = async () => {
  const response = await apiClient.get('/membership/dashboard')
  return response.data
}

export const getCurrentMonthLimits = async () => {
  const response = await apiClient.get('/membership/limits/current-month')
  return response.data
}

export const getCurrentLimits = getCurrentMonthLimits

export const loanPowerbank = async ({ powerbankId, commerceId, commerceName }) => {
  const response = await apiClient.post('/membership/powerbanks/loan', {
    powerbankId,
    commerceId,
    commerceName
  })
  return response.data
}

export const requestPowerbankLoan = loanPowerbank

export const returnPowerbank = async (loanId) => {
  const response = await apiClient.post(`/membership/powerbanks/${loanId}/return`)
  return response.data
}

export const getActivePowerbank = async () => {
  const response = await apiClient.get('/membership/powerbanks/active')
  return response.data
}

export const useEmergency = async ({ articleType, commerceId, commerceName }) => {
  const response = await apiClient.post('/membership/emergency/use', {
    articleType,
    commerceId,
    commerceName
  })
  return response.data
}

export const requestEmergencyArticle = useEmergency
