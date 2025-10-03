import express from 'express'
import { body } from 'express-validator'
import * as bannerController from '../controllers/bannerController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'
import { auditAdminAction } from '../middleware/audit.js'

const router = express.Router()

router.get('/active', bannerController.getActiveBanners)
router.get('/', requireAuth, requireRole(['admin']), bannerController.getAllBanners)
router.get('/:id', requireAuth, requireRole(['admin']), bannerController.getBannerById)

router.post('/', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('imageUrl').trim().notEmpty().withMessage('Image URL is required')
  ],
  bannerController.createBanner
)

router.put('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  bannerController.updateBanner
)

router.delete('/:id', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  bannerController.deleteBanner
)

router.patch('/:id/toggle', 
  requireAuth, 
  requireRole(['admin']), 
  adminLimiter,
  auditAdminAction,
  bannerController.toggleBannerActive
)

export default router
