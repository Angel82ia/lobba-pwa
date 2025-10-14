import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

let isRefreshing = false
let refreshSubscribers = []

const onRefreshed = token => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = callback => {
  refreshSubscribers.push(callback)
}

let apiClientCached = null
const getApiClient = async () => {
  if (apiClientCached) return apiClientCached
  const module = await import('./api.js')
  apiClientCached = module.default
  return apiClientCached
}

export const login = async (email, password) => {
  const apiClient = await getApiClient()
  const response = await apiClient.post('/auth/login', { email, password })
  const { user, tokens } = response.data

  setAuthTokens(tokens.accessToken, tokens.refreshToken)
  return user
}

export const register = async userData => {
  const apiClient = await getApiClient()
  const response = await apiClient.post('/auth/register', userData)
  const { user, tokens } = response.data

  setAuthTokens(tokens.accessToken, tokens.refreshToken)
  return user
}

export const logout = async () => {
  try {
    const apiClient = await getApiClient()
    await apiClient.post('/auth/logout')
  } finally {
    clearAuthTokens()
  }
}

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  if (isRefreshing) {
    return new Promise(resolve => {
      addRefreshSubscriber(token => {
        resolve(token)
      })
    })
  }

  isRefreshing = true

  try {
    const response = await axios.post(`/api/auth/refresh`, {
      refreshToken,
    })

    const { accessToken } = response.data
    localStorage.setItem('accessToken', accessToken)

    isRefreshing = false
    onRefreshed(accessToken)

    return accessToken
  } catch (error) {
    isRefreshing = false
    clearAuthTokens()
    throw error
  }
}

// Función centralizada para guardar tokens
export const setAuthTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

// Función centralizada para limpiar tokens
export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.setItem('logout-event', Date.now().toString())
  isRefreshing = false
  refreshSubscribers = []
}

export const getCurrentUser = async () => {
  const apiClient = await getApiClient()
  const response = await apiClient.get('/auth/me')
  return response.data
}

export const getStoredToken = () => {
  return localStorage.getItem('accessToken')
}

export const isTokenValid = token => {
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

export const hasValidTokens = () => {
  const accessToken = getStoredToken()
  const refreshToken = localStorage.getItem('refreshToken')

  if (accessToken && isTokenValid(accessToken)) {
    return true
  }

  if (refreshToken) {
    try {
      const decoded = jwtDecode(refreshToken)
      const currentTime = Date.now() / 1000
      return decoded.exp > currentTime
    } catch {
      return false
    }
  }

  return false
}
