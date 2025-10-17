import express from 'express'
import { authenticateUser } from '../middleware/auth.js'
import { getSettings, updateSettings } from '../controllers/salonSettingsController.js'

const router = express.Router()

router.get('/:salonId', getSettings)

router.put('/:salonId', authenticateUser, updateSettings)

export default router
