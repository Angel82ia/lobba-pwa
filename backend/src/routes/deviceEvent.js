import express from 'express'
import * as deviceEventController from '../controllers/deviceEventController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAuth, requireRole(['device', 'admin']), deviceEventController.createEvent)

router.get('/device/:deviceId', requireAuth, requireRole(['device', 'admin']), deviceEventController.getDeviceEvents)
router.get('/device/:deviceId/stats', requireAuth, requireRole(['device', 'admin']), deviceEventController.getDeviceStats)
router.get('/user', requireAuth, deviceEventController.getUserEvents)
router.get('/permission/:permissionId', requireAuth, deviceEventController.getEventsByPermission)
router.get('/errors', requireAuth, requireRole(['admin']), deviceEventController.getRecentErrors)

export default router
