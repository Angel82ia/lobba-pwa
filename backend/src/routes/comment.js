import express from 'express'
import { body } from 'express-validator'
import * as commentController from '../controllers/commentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', 
  requireAuth,
  [
    body('postId').notEmpty().withMessage('Post ID is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  commentController.createComment
)

router.get('/post/:postId', commentController.getPostComments)
router.delete('/:id', requireAuth, commentController.deleteComment)

export default router
