import express from 'express'
import * as communityController from '../controllers/communityController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/follow/:userId', requireAuth, communityController.followUser)
router.delete('/follow/:userId', requireAuth, communityController.unfollowUser)
router.get('/followers/:userId', communityController.getFollowers)
router.get('/following/:userId', communityController.getFollowing)
router.get('/profile/:userId', communityController.getUserProfile)

export default router
