import { verifyAccessToken } from '../utils/auth.js'
import { findUserById } from '../models/User.js'

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    
    const user = await findUserById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

export const requireMembership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.membership_status !== 'active') {
    return res.status(403).json({ 
      error: 'Active membership required',
      membershipStatus: req.user.membership_status 
    })
  }

  next()
}

export const authenticate = requireAuth
