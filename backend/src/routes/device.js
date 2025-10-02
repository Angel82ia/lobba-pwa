import express from 'express'
import { body } from 'express-validator'
import * as deviceProfileController from '../controllers/deviceProfileController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/:id', deviceProfileController.getDeviceProfile)

router.post(
  '/',
  requireAuth,
  [
    body('deviceId').trim().isLength({ min: 1 }),
    body('deviceName').trim().isLength({ min: 1 }),
    body('deviceType').optional().trim(),
    body('capabilities').optional().isArray(),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
  ],
  deviceProfileController.createDeviceProfile
)

router.put(
  '/:id',
  requireAuth,
  [
    body('deviceName').optional().trim().isLength({ min: 1 }),
    body('deviceType').optional().trim(),
  ],
  deviceProfileController.updateDeviceProfile
)

router.delete('/:id', requireAuth, deviceProfileController.deleteDeviceProfile)

router.put(
  '/:id/capabilities',
  requireAuth,
  [body('capabilities').isArray()],
  deviceProfileController.updateCapabilities
)

router.put(
  '/:id/location',
  requireAuth,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  deviceProfileController.updateLocation
)

export default router
