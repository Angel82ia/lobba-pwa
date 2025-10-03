import apiClient from './api'

export const getCart = async () => {
  const response = await apiClient.get('/cart')
  return response.data
}

export const addToCart = async (productId, variantId, quantity = 1) => {
  const response = await apiClient.post('/cart/add', { productId, variantId, quantity })
  return response.data
}

export const updateCartItem = async (itemId, quantity) => {
  const response = await apiClient.put(`/cart/items/${itemId}`, { quantity })
  return response.data
}

export const removeFromCart = async (itemId) => {
  const response = await apiClient.delete(`/cart/items/${itemId}`)
  return response.data
}

export const clearCart = async () => {
  const response = await apiClient.delete('/cart')
  return response.data
}
