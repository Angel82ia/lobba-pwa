import express from 'express'
import { body } from 'express-validator'
import * as profileController from '../controllers/profileController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/client/:id?', requireAuth, profileController.getProfile)

router.put(
  '/client',
  requireAuth,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('bio').optional().trim(),
    body('avatar').optional().isURL(),
  ],
  profileController.updateProfile
)

router.delete('/client', requireAuth, profileController.deleteProfile)

export default router
