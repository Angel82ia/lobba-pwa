import express from 'express'
import { body } from 'express-validator'
import * as equipmentController from '../controllers/equipmentController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'
import { auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', equipmentController.getAllEquipment)
router.get('/available', equipmentController.getAvailableEquipment)
router.get('/:id', equipmentController.getEquipmentById)

router.post('/', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required')
  ],
  equipmentController.createEquipment
)

router.put('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  equipmentController.updateEquipment
)

router.delete('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  equipmentController.deleteEquipment
)

router.patch('/:id/status', 
  requireAuth, 
  requireRole(['admin', 'device']), 
  adminLimiter,
  auditAdminAction,
  [
    body('status').isIn(['available', 'in_use', 'maintenance']).withMessage('Invalid status')
  ],
  equipmentController.updateEquipmentStatus
)

router.patch('/:id/location', 
  requireAuth, 
  requireRole(['admin', 'device']), 
  adminLimiter,
  auditAdminAction,
  equipmentController.updateEquipmentLocation
)

export default router
