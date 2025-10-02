import { createUser, findUserByEmail, findUserById } from '../models/User.js'
import { createRefreshToken, findRefreshToken, revokeAllUserTokens } from '../models/RefreshToken.js'
import { hashPassword, comparePasswords, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth.js'
import { validationResult } from 'express-validator'

export const register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password, firstName, lastName, role = 'user' } = req.body

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    })

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await createRefreshToken(user.id, refreshToken, expiresAt)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        membershipActive: user.membership_active,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    const user = await findUserByEmail(email)
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await comparePasswords(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await createRefreshToken(user.id, refreshToken, expiresAt)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        membershipActive: user.membership_active,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' })
    }

    const decoded = verifyRefreshToken(refreshToken)
    const storedToken = await findRefreshToken(refreshToken)

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const user = await findUserById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const accessToken = generateAccessToken(user)

    res.json({ accessToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
}

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.substring(7)

    if (token) {
      await revokeAllUserTokens(req.user.id)
    }

    res.status(204).send()
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

export const me = async (req, res) => {
  try {
    const user = await findUserById(req.user.id)
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      membershipActive: user.membership_active,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}
