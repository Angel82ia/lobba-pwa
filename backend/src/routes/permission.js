import express from 'express'
import * as permissionController from '../controllers/permissionController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/item', requireAuth, permissionController.requestItemPermission)
router.post('/equipment/pickup', requireAuth, permissionController.requestEquipmentPickup)
router.post('/equipment/return', requireAuth, permissionController.requestEquipmentReturn)
router.post('/validate', permissionController.validatePermission)

router.get('/user', requireAuth, permissionController.getUserPermissions)
router.get('/device/:deviceId', requireAuth, requireRole(['admin', 'device']), permissionController.getDevicePermissions)

router.delete('/:id', requireAuth, permissionController.cancelPermission)

export default router
