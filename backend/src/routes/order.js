import express from 'express'
import { body } from 'express-validator'
import * as orderController from '../controllers/orderController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { auditUserAction, auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', requireAuth, orderController.getUserOrders)
router.get('/:id', requireAuth, auditUserAction, orderController.getOrderById)
router.put('/:id/status', requireAuth, requireRole(['admin', 'salon']), [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], auditAdminAction, orderController.updateOrderStatus)

export default router
