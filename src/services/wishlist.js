import apiClient from './api'

export const getWishlist = async () => {
  const response = await apiClient.get('/wishlist')
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
