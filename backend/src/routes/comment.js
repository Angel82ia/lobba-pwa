import express from 'express'
import * as commentController from '../controllers/commentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', requireAuth, commentController.createComment)
router.get('/post/:postId', commentController.getPostComments)
router.delete('/:id', requireAuth, commentController.deleteComment)

export default router
