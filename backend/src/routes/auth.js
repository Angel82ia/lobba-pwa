import express from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import passport from '../config/passport.js'
import { generateAccessToken, generateRefreshToken } from '../utils/auth.js'
import { createRefreshToken } from '../models/RefreshToken.js'
import { authLimiter } from '../middleware/rateLimits.js'
import { auditAuthAction } from '../middleware/audit.js'

const router = express.Router()

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('role').optional().isIn(['user', 'salon', 'admin', 'device']),
  ],
  auditAuthAction,
  authController.register
)

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  auditAuthAction,
  authController.login
)

router.post('/refresh', auditAuthAction, authController.refresh)

router.post('/logout', requireAuth, auditAuthAction, authController.logout)

router.get('/me', requireAuth, authController.me)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user)
      const refreshToken = generateRefreshToken(req.user)
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await createRefreshToken(req.user.id, refreshToken, expiresAt)

      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`)
    } catch (error) {
      res.redirect('/login?error=auth_failed')
    }
  }
)

router.post('/apple', passport.authenticate('apple', { session: false }))

router.post(
  '/apple/callback',
  passport.authenticate('apple', { session: false }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user)
      const refreshToken = generateRefreshToken(req.user)
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await createRefreshToken(req.user.id, refreshToken, expiresAt)

      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          membershipActive: req.user.membership_active,
        },
        tokens: { accessToken, refreshToken },
      })
    } catch (error) {
      res.status(500).json({ error: 'Authentication failed' })
    }
  }
)

export default router
