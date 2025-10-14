import apiClient from './api'

export const createSharedMembership = async (data) => {
  const response = await apiClient.post('/membership/share', data)
  return response.data
}

export const getSharedMembership = async (membershipId) => {
  const response = await apiClient.get(`/membership/${membershipId}/share`)
  return response.data
}

export const updateSharedMembership = async (id, data) => {
  const response = await apiClient.patch(`/membership/share/${id}`, data)
  return response.data
}

export const revokeSharedMembership = async (id) => {
  const response = await apiClient.post(`/membership/share/${id}/revoke`)
  return response.data
}

export const getMySharedMemberships = async () => {
  const response = await apiClient.get('/membership/my-shared')
  return response.data
}

export const createMembership = async (data) => {
  const response = await apiClient.post('/membership', data)
  return response.data
}

export const getMyMemberships = async () => {
  const response = await apiClient.get('/membership/my')
  return response.data
}

export const getActiveMembership = async () => {
  const response = await apiClient.get('/membership/active')
  return response.data
}

export const cancelMembership = async (membershipId) => {
  const response = await apiClient.post(`/membership/${membershipId}/cancel`)
  return response.data
}
