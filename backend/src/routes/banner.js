import express from 'express'
import * as bannerController from '../controllers/bannerController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/active', bannerController.getActiveBanners)
router.get('/', requireAuth, requireRole(['admin']), bannerController.getAllBanners)
router.get('/:id', requireAuth, requireRole(['admin']), bannerController.getBannerById)
router.post('/', requireAuth, requireRole(['admin']), bannerController.createBanner)
router.put('/:id', requireAuth, requireRole(['admin']), bannerController.updateBanner)
router.delete('/:id', requireAuth, requireRole(['admin']), bannerController.deleteBanner)
router.patch('/:id/toggle', requireAuth, requireRole(['admin']), bannerController.toggleBannerActive)

export default router
