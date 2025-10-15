import api from '../utils/api'

export const createSharedMembership = async (membershipId, data) => {
  try {
    const response = await api.post('/membership/shared', {
      membershipId,
      ...data
    })
    return response.data
  } catch (error) {
    console.error('Error creating shared membership:', error)
    throw error
  }
}

export const getSharedMembershipByMembershipId = async (membershipId) => {
  try {
    const response = await api.get(`/membership/shared/${membershipId}`)
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    console.error('Error getting shared membership:', error)
    throw error
  }
}

export const getMySharedMemberships = async () => {
  try {
    const response = await api.get('/membership/shared')
    return response.data
  } catch (error) {
    console.error('Error getting my shared memberships:', error)
    throw error
  }
}

export const updateSharedMembership = async (id, data) => {
  try {
    const response = await api.put(`/membership/shared/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating shared membership:', error)
    throw error
  }
}

export const revokeSharedMembership = async (id) => {
  try {
    const response = await api.delete(`/membership/shared/${id}`)
    return response.data
  } catch (error) {
    console.error('Error revoking shared membership:', error)
    throw error
  }
}
