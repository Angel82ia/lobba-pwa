import apiClient from './api'
import { jwtDecode } from 'jwt-decode'

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password })
  const { user, tokens } = response.data

  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)

  return user
}

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData)
  const { user, tokens } = response.data

  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)

  return user
}

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export const getStoredToken = () => {
  return localStorage.getItem('accessToken')
}

export const isTokenValid = (token) => {
  if (!token) return false

  try {
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp > currentTime
  } catch (error) {
    return false
  }
}

export const getUserRole = () => {
  const token = getStoredToken()
  if (!token || !isTokenValid(token)) return null

  try {
    const decoded = jwtDecode(token)
    return decoded.role
  } catch (error) {
    return null
  }
}
