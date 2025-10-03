import express from 'express'
import { body } from 'express-validator'
import * as productController from '../controllers/productController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'
import { auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', productController.getAllProducts)
router.get('/:id', productController.getProductById)

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  adminLimiter,
  [
    body('name').trim().isLength({ min: 1 }),
    body('slug').trim().isLength({ min: 1 }),
    body('basePrice').isFloat({ min: 0 }),
    body('stockQuantity').isInt({ min: 0 }),
  ],
  auditAdminAction,
  productController.createProduct
)

router.put('/:id', requireAuth, requireRole('admin'), adminLimiter, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('slug').optional().trim().isLength({ min: 1 }),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 })
], auditAdminAction, productController.updateProduct)
router.delete('/:id', requireAuth, requireRole('admin'), adminLimiter, auditAdminAction, productController.deleteProduct)
router.post('/:id/images', requireAuth, requireRole('admin'), adminLimiter, auditAdminAction, productController.uploadProductImage)

export default router
