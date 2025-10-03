import apiClient from './api'

export const getUserOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  const response = await apiClient.get(`/orders?${params}`)
  return response.data
}

export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data
}

export const updateOrderStatus = async (id, status) => {
  const response = await apiClient.put(`/orders/${id}/status`, { status })
  return response.data
}
