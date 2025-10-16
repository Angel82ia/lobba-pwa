import express from 'express'
import { body } from 'express-validator'
import * as categoryController from '../controllers/categoryController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'
import { auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/', categoryController.getAllCategories)

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  adminLimiter,
  [body('name').trim().isLength({ min: 1 }), body('slug').trim().isLength({ min: 1 })],
  auditAdminAction,
  categoryController.createCategory
)

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  adminLimiter,
  [
    body('name').optional().trim().isLength({ min: 1 }),
    body('slug').optional().trim().isLength({ min: 1 }),
  ],
  auditAdminAction,
  categoryController.updateCategory
)
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  adminLimiter,
  auditAdminAction,
  categoryController.deleteCategory
)

export default router
