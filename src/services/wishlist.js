import apiClient from './api'

export const getWishlist = async (signal = null) => {
  const response = await apiClient.get('/wishlist', { signal })
  return response.data
}

export const addToWishlist = async (productId) => {
  const response = await apiClient.post('/wishlist', { productId })
  return response.data
}

export const removeFromWishlist = async (productId) => {
  const response = await apiClient.delete(`/wishlist/${productId}`)
  return response.data
}
