import apiClient from './api'

export const createSharedMembership = async (membershipId, data) => {
  const response = await apiClient.post('/membership/shared', {
    membershipId,
    ...data,
  })
  return response.data
}

export const getSharedMembershipByMembershipId = async membershipId => {
  try {
    const response = await apiClient.get(`/membership/shared/${membershipId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export const getMySharedMemberships = async () => {
  const response = await apiClient.get('/membership/shared')
  return response.data
}

export const updateSharedMembership = async (id, data) => {
  const response = await apiClient.put(`/membership/shared/${id}`, data)
  return response.data
}

export const revokeSharedMembership = async id => {
  const response = await apiClient.delete(`/membership/shared/${id}`)
  return response.data
}
