import express from 'express'
import { body, param } from 'express-validator'
import passport from 'passport'
import {
  getMembershipDashboard,
  getCurrentLimits,
  requestPowerbankLoan,
  completePowerbankReturn,
  getActivePowerbank,
  requestEmergencyArticle
} from '../controllers/membershipDashboardController.js'

const router = express.Router()

const authMiddleware = passport.authenticate('jwt', { session: false })

router.get('/dashboard', authMiddleware, getMembershipDashboard)

router.get('/limits', authMiddleware, getCurrentLimits)

router.post('/powerbank/loan', 
  authMiddleware,
  [
    body('powerbankId').notEmpty().withMessage('Powerbank ID is required'),
    body('commerceId').optional(),
    body('commerceName').optional()
  ],
  requestPowerbankLoan
)

router.post('/powerbank/:loanId/return',
  authMiddleware,
  [
    param('loanId').isUUID().withMessage('Invalid loan ID')
  ],
  completePowerbankReturn
)

router.get('/powerbank/active', authMiddleware, getActivePowerbank)

router.post('/emergency',
  authMiddleware,
  [
    body('articleType').isIn(['tampon', 'pad']).withMessage('Article type must be tampon or pad'),
    body('commerceId').optional(),
    body('commerceName').optional()
  ],
  requestEmergencyArticle
)

export default router
