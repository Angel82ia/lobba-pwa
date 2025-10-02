import apiClient from './api'

export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters)
  const response = await apiClient.get(`/products?${params}`)
  return response.data
}

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`)
  return response.data
}

export const getProductBySlug = async (slug) => {
  const response = await apiClient.get(`/products/${slug}`)
  return response.data
}

export const getCategories = async () => {
  const response = await apiClient.get('/categories')
  return response.data
}

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData)
  return response.data
}

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/products/${id}`, productData)
  return response.data
}

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`)
  return response.data
}
