import express from 'express'
import { body } from 'express-validator'
import * as postController from '../controllers/postController.js'
import { requireAuth } from '../middleware/auth.js'
import { auditUserAction } from '../middleware/audit.js'

const router = express.Router()

router.post('/', 
  requireAuth, 
  auditUserAction,
  [
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  postController.createPost
)

router.get('/feed', requireAuth, postController.getFeed)
router.get('/all', postController.getAllPosts)
router.get('/:id', postController.getPostById)
router.get('/user/:userId', postController.getUserPosts)

router.put('/:id', 
  requireAuth, 
  auditUserAction,
  postController.updatePost
)

router.delete('/:id', 
  requireAuth, 
  auditUserAction,
  postController.deletePost
)

router.post('/:id/like', requireAuth, postController.likePost)
router.delete('/:id/like', requireAuth, postController.unlikePost)

export default router
