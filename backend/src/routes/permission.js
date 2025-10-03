import express from 'express'
import * as permissionController from '../controllers/permissionController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { deviceValidationLimiter } from '../middleware/rateLimits.js'
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.post('/item', requireAuth, auditUserAction, permissionController.requestItemPermission)
router.post('/equipment/pickup', requireAuth, auditUserAction, permissionController.requestEquipmentPickup)
router.post('/equipment/return', requireAuth, auditUserAction, permissionController.requestEquipmentReturn)
router.post('/validate', deviceValidationLimiter, permissionController.validatePermission)

router.get('/user', requireAuth, permissionController.getUserPermissions)
router.get('/device/:deviceId', requireAuth, requireRole(['admin', 'device']), permissionController.getDevicePermissions)

router.delete('/:id', requireAuth, auditUserAction, permissionController.cancelPermission)

export default router
