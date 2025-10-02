import express from 'express'
import { body } from 'express-validator'
import * as productController from '../controllers/productController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', productController.getAllProducts)
router.get('/:id', productController.getProductById)

router.post(
  '/',
  requireAuth,
  [
    body('name').trim().isLength({ min: 1 }),
    body('slug').trim().isLength({ min: 1 }),
    body('basePrice').isFloat({ min: 0 }),
    body('stockQuantity').isInt({ min: 0 }),
  ],
  productController.createProduct
)

router.put('/:id', requireAuth, productController.updateProduct)
router.delete('/:id', requireAuth, productController.deleteProduct)
router.post('/:id/images', requireAuth, productController.uploadProductImage)

export default router
