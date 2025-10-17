import apiClient from './api'

export const getAvailableSlots = async (salonId, serviceId, date) => {
  const response = await apiClient.get('/reservations/slots', {
    params: { salonId, serviceId, date },
  })
  return response.data
}

export const createReservation = async (data) => {
  const response = await apiClient.post('/reservations', data)
  return response.data
}

export const getReservation = async (id) => {
  const response = await apiClient.get(`/reservations/${id}`)
  return response.data
}

export const getUserReservations = async (filters = {}) => {
  const response = await apiClient.get('/reservations/user/', { params: filters })
  return response.data
}

export const getSalonReservations = async (salonId, filters = {}) => {
  const response = await apiClient.get(`/reservations/salon/${salonId}`, { params: filters })
  return response.data
}

export const confirmReservation = async (id) => {
  const response = await apiClient.put(`/reservations/${id}/confirm`)
  return response.data
}

export const cancelReservation = async (id, reason) => {
  const response = await apiClient.put(`/reservations/${id}/cancel`, { reason })
  return response.data
}

export const completeReservation = async (id, status) => {
  const response = await apiClient.put(`/reservations/${id}/complete`, { status })
  return response.data
}

export const rejectReservation = async (id, reason) => {
  const response = await apiClient.put(`/reservations/${id}/reject`, { reason })
  return response.data
}
