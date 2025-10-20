import express from 'express'
import { getSalonCapacityInfo, getDayAvailabilitySlots, checkSpecificSlot } from '../controllers/availabilityController.js'

const router = express.Router()

router.get('/salon/:salonId/capacity', getSalonCapacityInfo)

router.get('/salon/:salonId/day', getDayAvailabilitySlots)

router.get('/salon/:salonId/check-slot', checkSpecificSlot)

export default router
