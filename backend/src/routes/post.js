import express from 'express'
import * as postController from '../controllers/postController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAuth, postController.createPost)
router.get('/feed', requireAuth, postController.getFeed)
router.get('/all', postController.getAllPosts)
router.get('/:id', postController.getPostById)
router.get('/user/:userId', postController.getUserPosts)
router.put('/:id', requireAuth, postController.updatePost)
router.delete('/:id', requireAuth, postController.deletePost)
router.post('/:id/like', requireAuth, postController.likePost)
router.delete('/:id/like', requireAuth, postController.unlikePost)

export default router
