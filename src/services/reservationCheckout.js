import apiClient from './api'

/**
 * Calcular precio de checkout de reserva
 */
export const calculateReservationCheckout = async (serviceId, startTime, endTime) => {
  const response = await apiClient.post('/reservation-checkout/calculate', {
    serviceId,
    startTime,
    endTime,
  })
  return response.data
}

/**
 * Procesar checkout de reserva - Crea el Payment Intent
 */
export const processReservationCheckout = async data => {
  const response = await apiClient.post('/reservation-checkout/process', data)
  return response.data
}

/**
 * Confirmar reserva tras pago exitoso
 */
export const confirmReservationPayment = async paymentIntentId => {
  const response = await apiClient.post('/reservation-checkout/confirm', {
    paymentIntentId,
  })
  return response.data
}

/**
 * Cancelar reserva con reembolso
 */
export const cancelReservationWithRefund = async (reservationId, reason) => {
  const response = await apiClient.delete(`/reservation-checkout/${reservationId}/cancel`, {
    data: { reason },
  })
  return response.data
}
