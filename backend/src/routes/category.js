import express from 'express'
import { body } from 'express-validator'
import * as categoryController from '../controllers/categoryController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', categoryController.getAllCategories)

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('name').trim().isLength({ min: 1 }),
    body('slug').trim().isLength({ min: 1 }),
  ],
  categoryController.createCategory
)

router.put('/:id', requireAuth, requireRole('admin'), categoryController.updateCategory)
router.delete('/:id', requireAuth, requireRole('admin'), categoryController.deleteCategory)

export default router
