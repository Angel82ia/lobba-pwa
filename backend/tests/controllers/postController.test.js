import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as postController from '../../src/controllers/postController.js'
import * as Post from '../../src/models/Post.js'
import * as PostLike from '../../src/models/PostLike.js'

vi.mock('../../src/models/Post.js')
vi.mock('../../src/models/PostLike.js')

describe('Post Controller', () => {
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

  describe('createPost', () => {
    it('should create a new post', async () => {
      req.body = { content: 'Test post', imageUrl: null }
      const mockPost = { id: '123', content: 'Test post' }
      Post.createPost.mockResolvedValue(mockPost)

      await postController.createPost(req, res)

      expect(Post.createPost).toHaveBeenCalledWith({
        userId: 'user-1',
        content: 'Test post',
        imageUrl: null
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockPost)
    })

    it('should return 400 if content is missing', async () => {
      req.body = { content: '' }

      await postController.createPost(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'El contenido es requerido'
      })
    })
  })

  describe('getFeed', () => {
    it('should get user feed', async () => {
      req.query = { page: 1, limit: 20 }
      const mockPosts = [{ id: '1' }, { id: '2' }]
      Post.findFeedPosts.mockResolvedValue(mockPosts)

      await postController.getFeed(req, res)

      expect(Post.findFeedPosts).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20
      })
      expect(res.json).toHaveBeenCalledWith(mockPosts)
    })
  })

  describe('likePost', () => {
    it('should like a post', async () => {
      req.params = { id: 'post-1' }
      const mockPost = { id: 'post-1' }
      const mockLike = { id: 'like-1' }
      
      Post.findPostById.mockResolvedValue(mockPost)
      PostLike.likePost.mockResolvedValue(mockLike)
      Post.incrementLikes.mockResolvedValue(mockPost)

      await postController.likePost(req, res)

      expect(PostLike.likePost).toHaveBeenCalledWith({
        postId: 'post-1',
        userId: 'user-1'
      })
      expect(Post.incrementLikes).toHaveBeenCalledWith('post-1')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Like añadido correctamente'
      })
    })

    it('should return 404 if post not found', async () => {
      req.params = { id: 'post-1' }
      Post.findPostById.mockResolvedValue(null)

      await postController.likePost(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post no encontrado'
      })
    })

    it('should return 400 if already liked', async () => {
      req.params = { id: 'post-1' }
      const mockPost = { id: 'post-1' }
      
      Post.findPostById.mockResolvedValue(mockPost)
      PostLike.likePost.mockResolvedValue(null)

      await postController.likePost(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya has dado like a este post'
      })
    })
  })

  describe('deletePost', () => {
    it('should delete own post', async () => {
      req.params = { id: 'post-1' }
      const mockPost = { id: 'post-1', user_id: 'user-1' }
      
      Post.findPostById.mockResolvedValue(mockPost)
      Post.deletePost.mockResolvedValue(mockPost)

      await postController.deletePost(req, res)

      expect(Post.deletePost).toHaveBeenCalledWith('post-1')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post eliminado correctamente'
      })
    })

    it('should return 403 if not authorized', async () => {
      req.params = { id: 'post-1' }
      const mockPost = { id: 'post-1', user_id: 'other-user' }
      
      Post.findPostById.mockResolvedValue(mockPost)

      await postController.deletePost(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No autorizado para eliminar este post'
      })
    })
  })
})
