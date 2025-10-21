import apiClient from './api'

/**
 * Verificar si un salón tiene WhatsApp habilitado
 */
export const checkSalonWhatsApp = async salonId => {
  const response = await apiClient.get(`/whatsapp/salon/${salonId}/check`)
  return response.data
}

/**
 * Obtener enlace de WhatsApp para contactar un salón
 */
export const getWhatsAppLink = async (salonId, reservationId = null, context = 'general') => {
  const params = new URLSearchParams()
  if (reservationId) params.append('reservationId', reservationId)
  params.append('context', context)

  const queryString = params.toString()
  const url = `/whatsapp/salon/${salonId}/link${queryString ? `?${queryString}` : ''}`

  const response = await apiClient.get(url)
  return response.data
}
