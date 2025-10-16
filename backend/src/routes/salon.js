import express from 'express'
import { body } from 'express-validator'
import * as salonProfileController from '../controllers/salonProfileController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/categories', salonProfileController.getAllCategories)

router.get(
  '/nearby',
  [
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('radius').optional().isFloat({ min: 0.1, max: 50 }),
  ],
  salonProfileController.getSalonsNearby
)

router.get('/', salonProfileController.getAllSalons)

router.get('/:id', salonProfileController.getSalonProfile)

router.post(
  '/',
  requireAuth,
  [
    body('businessName').trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('postalCode').optional().trim(),
    body('phone').optional().trim(),
    body('website').optional({ nullable: true, checkFalsy: true }).isURL(),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
    body('businessHours').optional().isObject(),
    body('isClickCollect').optional().isBoolean(),
    body('acceptsReservations').optional().isBoolean(),
  ],
  salonProfileController.createSalonProfile
)

router.put(
  '/:id',
  requireAuth,
  [
    body('businessName').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('postalCode').optional().trim(),
    body('phone').optional().trim(),
    body('website').optional({ nullable: true, checkFalsy: true }).isURL(),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
    body('businessHours').optional().isObject(),
    body('isClickCollect').optional().isBoolean(),
    body('acceptsReservations').optional().isBoolean(),
  ],
  salonProfileController.updateSalonProfile
)

router.delete('/:id', requireAuth, salonProfileController.deleteSalonProfile)

router.get('/:id/services', salonProfileController.getSalonServices)

router.post(
  '/:id/services',
  requireAuth,
  [
    body('name').trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('price').isFloat({ min: 0 }),
    body('durationMinutes').isInt({ min: 1 }),
    body('discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  ],
  salonProfileController.createSalonService
)

router.post(
  '/:id/categories',
  requireAuth,
  [body('categoryId').isUUID()],
  salonProfileController.assignCategory
)

export default router
