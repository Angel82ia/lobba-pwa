import express from 'express'
import * as orderController from '../controllers/orderController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', requireAuth, orderController.getUserOrders)
router.get('/:id', requireAuth, orderController.getOrderById)
router.put('/:id/status', requireAuth, orderController.updateOrderStatus)

export default router
