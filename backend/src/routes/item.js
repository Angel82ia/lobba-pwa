import express from 'express'
import { body } from 'express-validator'
import * as itemController from '../controllers/itemController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'
import { auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', itemController.getAllItems)
router.get('/:id', itemController.getItemById)
router.get('/:id/stock', itemController.checkStock)

router.post('/', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer')
  ],
  itemController.createItem
)

router.put('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  itemController.updateItem
)

router.delete('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  itemController.deleteItem
)

router.patch('/:id/stock', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  [
    body('quantity').isInt().withMessage('Quantity must be an integer')
  ],
  itemController.updateStock
)

export default router
