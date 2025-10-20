import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createAvailabilityBlock,
  getSalonBlocks,
  getBlocksInRange,
  updateAvailabilityBlock,
  deleteAvailabilityBlock,
} from '../controllers/availabilityBlockController.js'

const router = express.Router()

router.post('/salon/:salonId', requireAuth, createAvailabilityBlock)

router.get('/salon/:salonId', getSalonBlocks)

router.get('/salon/:salonId/range', getBlocksInRange)

router.put('/:blockId', requireAuth, updateAvailabilityBlock)

router.delete('/:blockId', requireAuth, deleteAvailabilityBlock)

export default router
