import express from 'express'
import { body } from 'express-validator'
import * as productController from '../controllers/productController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', productController.getAllProducts)
router.get('/:id', productController.getProductById)

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('name').trim().isLength({ min: 1 }),
    body('slug').trim().isLength({ min: 1 }),
    body('basePrice').isFloat({ min: 0 }),
    body('stockQuantity').isInt({ min: 0 }),
  ],
  productController.createProduct
)

router.put('/:id', requireAuth, requireRole('admin'), productController.updateProduct)
router.delete('/:id', requireAuth, requireRole('admin'), productController.deleteProduct)
router.post('/:id/images', requireAuth, requireRole('admin'), productController.uploadProductImage)

export default router
