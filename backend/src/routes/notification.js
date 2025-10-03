import express from 'express'
import * as notificationController from '../controllers/notificationController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/register-token', requireAuth, notificationController.registerFCMToken)

router.get('/preferences', requireAuth, notificationController.getNotificationPreferences)
router.put('/preferences', requireAuth, notificationController.updateNotificationPreferences)

router.post('/send', requireAuth, requireRole(['salon']), notificationController.sendNotification)
router.get('/history', requireAuth, requireRole(['salon']), notificationController.getNotificationHistory)

router.get('/all', requireAuth, requireRole(['admin']), notificationController.getAllNotifications)

export default router
