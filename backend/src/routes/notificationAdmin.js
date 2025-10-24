/**
 * Notification Admin Routes - FASE 2
 * 
 * Rutas para gestión y monitoreo de notificaciones
 */

import express from 'express'
import * as notificationAdminController from '../controllers/notificationAdminController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/health', notificationAdminController.getNotificationHealth)

router.use(authenticateToken)

router.get('/appointment/:appointmentId', notificationAdminController.getAppointmentNotifications)

router.post('/:notificationId/resend', notificationAdminController.resendNotification)

router.get('/stats', notificationAdminController.getNotificationStats)

router.get('/recent', notificationAdminController.getRecentNotifications)

export default router
