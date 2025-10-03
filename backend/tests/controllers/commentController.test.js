import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as commentController from '../../src/controllers/commentController.js'
import * as Comment from '../../src/models/Comment.js'
import * as Post from '../../src/models/Post.js'

vi.mock('../../src/models/Comment.js')
vi.mock('../../src/models/Post.js')

describe('Comment Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', role: 'user' }
    }
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('createComment', () => {
    it('should create a new comment', async () => {
      req.body = { postId: 'post-1', content: 'Test comment' }
      const mockPost = { id: 'post-1' }
      const mockComment = { id: '123', content: 'Test comment' }
      
      Post.findPostById.mockResolvedValue(mockPost)
      Comment.createComment.mockResolvedValue(mockComment)
      Post.incrementComments.mockResolvedValue(mockPost)

      await commentController.createComment(req, res)

      expect(Comment.createComment).toHaveBeenCalledWith({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Test comment'
      })
      expect(Post.incrementComments).toHaveBeenCalledWith('post-1')
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockComment)
    })

    it('should return 400 if content is missing', async () => {
      req.body = { postId: 'post-1', content: '' }

      await commentController.createComment(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 if post not found', async () => {
      req.body = { postId: 'post-1', content: 'Test' }
      Post.findPostById.mockResolvedValue(null)

      await commentController.createComment(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post no encontrado'
      })
    })
  })

  describe('getPostComments', () => {
    it('should get comments for a post', async () => {
      req.params = { postId: 'post-1' }
      req.query = { page: 1, limit: 50 }
      const mockComments = [{ id: '1' }, { id: '2' }]
      
      Comment.findCommentsByPostId.mockResolvedValue(mockComments)

      await commentController.getPostComments(req, res)

      expect(Comment.findCommentsByPostId).toHaveBeenCalledWith('post-1', {
        page: 1,
        limit: 50
      })
      expect(res.json).toHaveBeenCalledWith(mockComments)
    })
  })

  describe('deleteComment', () => {
    it('should delete own comment', async () => {
      req.params = { id: 'comment-1' }
      const mockComment = { id: 'comment-1', user_id: 'user-1', post_id: 'post-1' }
      
      Comment.findCommentById.mockResolvedValue(mockComment)
      Comment.deleteComment.mockResolvedValue(mockComment)
      Post.decrementComments.mockResolvedValue({})

      await commentController.deleteComment(req, res)

      expect(Comment.deleteComment).toHaveBeenCalledWith('comment-1')
      expect(Post.decrementComments).toHaveBeenCalledWith('post-1')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comentario eliminado correctamente'
      })
    })

    it('should return 403 if not authorized', async () => {
      req.params = { id: 'comment-1' }
      const mockComment = { id: 'comment-1', user_id: 'other-user' }
      
      Comment.findCommentById.mockResolvedValue(mockComment)

      await commentController.deleteComment(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
