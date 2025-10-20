import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getSettings, updateSettings } from '../controllers/salonSettingsController.js'

const router = express.Router()

router.get('/:salonId', getSettings)

router.put('/:salonId', requireAuth, updateSettings)

export default router
