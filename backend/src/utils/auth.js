import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

export const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipActive: user.membership_active,
      membershipStatus: user.membership_status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  )
}

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}
