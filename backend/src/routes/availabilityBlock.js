import express from 'express'
import { authenticateUser } from '../middleware/auth.js'
import {
  createAvailabilityBlock,
  getSalonBlocks,
  getBlocksInRange,
  updateAvailabilityBlock,
  deleteAvailabilityBlock
} from '../controllers/availabilityBlockController.js'

const router = express.Router()

router.post('/salon/:salonId', authenticateUser, createAvailabilityBlock)

router.get('/salon/:salonId', getSalonBlocks)

router.get('/salon/:salonId/range', getBlocksInRange)

router.put('/:blockId', authenticateUser, updateAvailabilityBlock)

router.delete('/:blockId', authenticateUser, deleteAvailabilityBlock)

export default router
