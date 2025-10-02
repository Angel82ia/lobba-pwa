import express from 'express'
import { body } from 'express-validator'
import * as categoryController from '../controllers/categoryController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', categoryController.getAllCategories)

router.post(
  '/',
  requireAuth,
  [
    body('name').trim().isLength({ min: 1 }),
    body('slug').trim().isLength({ min: 1 }),
  ],
  categoryController.createCategory
)

router.put('/:id', requireAuth, categoryController.updateCategory)
router.delete('/:id', requireAuth, categoryController.deleteCategory)

export default router
