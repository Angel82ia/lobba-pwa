import express from 'express'
import { body, param } from 'express-validator'
import * as membershipController from '../controllers/membershipController.js'
import * as dashboardController from '../controllers/membershipDashboardController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/dashboard', requireAuth, dashboardController.getDashboard)

router.get('/limits/current-month', requireAuth, dashboardController.getCurrentLimits)

router.post(
  '/emergency/use',
  requireAuth,
  [
    body('articleType').isIn(['pad', 'tampon']).withMessage('Invalid article type'),
    body('commerceId').notEmpty().withMessage('Commerce ID required'),
    body('commerceName').notEmpty().withMessage('Commerce name required'),
  ],
  dashboardController.requestEmergencyArticle
)

router.get('/powerbanks/active', requireAuth, dashboardController.getActivePowerbank)

router.post(
  '/powerbanks/loan',
  requireAuth,
  [
    body('powerbankId').notEmpty().withMessage('Powerbank ID required'),
    body('commerceId').notEmpty().withMessage('Commerce ID required'),
    body('commerceName').notEmpty().withMessage('Commerce name required'),
  ],
  dashboardController.requestPowerbankLoan
)

router.post(
  '/powerbanks/:loanId/return',
  requireAuth,
  [param('loanId').isUUID().withMessage('Invalid loan ID')],
  dashboardController.completePowerbankReturn
)

router.post(
  '/share',
  requireAuth,
  requireRole(['user']),
  [
    body('membershipId').isUUID().withMessage('Invalid membership ID'),
    body('sharedWithName').trim().notEmpty().withMessage('Beneficiary name is required'),
    body('sharedWithBirthdate').isISO8601().withMessage('Invalid birthdate format'),
    body('relation').optional().trim().isLength({ min: 1, max: 50 }),
  ],
  membershipController.createSharedMembership
)

router.get(
  '/:membershipId/share',
  requireAuth,
  [param('membershipId').isUUID()],
  membershipController.getSharedMembershipByMembershipId
)

router.patch(
  '/share/:id',
  requireAuth,
  [
    param('id').isUUID(),
    body('sharedWithName').optional().trim().notEmpty(),
    body('sharedWithBirthdate').optional().isISO8601(),
    body('relation').optional().trim().isLength({ min: 1, max: 50 }),
  ],
  membershipController.updateSharedMembership
)

router.post(
  '/share/:id/revoke',
  requireAuth,
  [param('id').isUUID()],
  membershipController.revokeSharedMembership
)

router.get(
  '/my-shared',
  requireAuth,
  membershipController.getMySharedMemberships
)

export default router
