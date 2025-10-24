import apiClient from './api'

/**
 * Crear cuenta Stripe Connect para salón
 */
export const createStripeConnectAccount = async salonProfileId => {
  const response = await apiClient.post('/stripe-connect/create', {
    salonProfileId,
  })
  return response.data
}

/**
 * Obtener estado de cuenta Stripe Connect
 */
export const getStripeConnectStatus = async salonProfileId => {
  const response = await apiClient.get(`/stripe-connect/status/${salonProfileId}`)
  return response.data
}

/**
 * Refrescar link de onboarding (si expiró)
 */
export const refreshStripeConnectLink = async salonProfileId => {
  const response = await apiClient.post('/stripe-connect/refresh-link', {
    salonProfileId,
  })
  return response.data
}

/**
 * Actualizar estado de cuenta Stripe Connect (útil después del onboarding)
 */
export const updateAccountStatus = async salonProfileId => {
  const response = await apiClient.get(`/stripe-connect/status/${salonProfileId}`)
  return response.data
}
