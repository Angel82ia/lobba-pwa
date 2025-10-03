import express from 'express'
import * as equipmentController from '../controllers/equipmentController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', equipmentController.getAllEquipment)
router.get('/available', equipmentController.getAvailableEquipment)
router.get('/:id', equipmentController.getEquipmentById)

router.post('/', requireAuth, requireRole(['admin']), equipmentController.createEquipment)
router.put('/:id', requireAuth, requireRole(['admin']), equipmentController.updateEquipment)
router.delete('/:id', requireAuth, requireRole(['admin']), equipmentController.deleteEquipment)
router.patch('/:id/status', requireAuth, requireRole(['admin', 'device']), equipmentController.updateEquipmentStatus)
router.patch('/:id/location', requireAuth, requireRole(['admin', 'device']), equipmentController.updateEquipmentLocation)

export default router
