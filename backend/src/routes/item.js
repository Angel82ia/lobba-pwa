import express from 'express'
import * as itemController from '../controllers/itemController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', itemController.getAllItems)
router.get('/:id', itemController.getItemById)
router.get('/:id/stock', itemController.checkStock)

router.post('/', requireAuth, requireRole(['admin']), itemController.createItem)
router.put('/:id', requireAuth, requireRole(['admin']), itemController.updateItem)
router.delete('/:id', requireAuth, requireRole(['admin']), itemController.deleteItem)
router.patch('/:id/stock', requireAuth, requireRole(['admin']), itemController.updateStock)

export default router
