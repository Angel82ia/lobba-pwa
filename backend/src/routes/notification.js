import express from 'express'
import { body } from 'express-validator'
import * as notificationController from '../controllers/notificationController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { generalLimiter } from '../middleware/rateLimits.js'
import { auditUserAction, auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.post('/register-token', requireAuth, [
  body('token').trim().notEmpty().withMessage('FCM token is required')
], notificationController.registerFCMToken)

router.get('/preferences', requireAuth, notificationController.getNotificationPreferences)
router.put('/preferences', requireAuth, auditUserAction, notificationController.updateNotificationPreferences)

router.post('/send', requireAuth, requireRole(['salon']), generalLimiter, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('radius').optional().isInt({ min: 1, max: 50 }).withMessage('Radius must be between 1 and 50 km')
], auditUserAction, notificationController.sendNotification)
router.get('/history', requireAuth, requireRole(['salon']), notificationController.getNotificationHistory)

router.get('/all', requireAuth, requireRole(['admin']), auditAdminAction, notificationController.getAllNotifications)

export default router
