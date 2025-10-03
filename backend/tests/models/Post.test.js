import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Post from '../../src/models/Post.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('Post Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createPost', () => {
    it('should create a new post', async () => {
      const mockPost = {
        id: '123',
        user_id: 'user-1',
        content: 'Test post',
        image_url: null,
        likes_count: 0,
        comments_count: 0,
        is_public: true,
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockPost] })

      const result = await Post.createPost({
        userId: 'user-1',
        content: 'Test post',
        imageUrl: null
      })

      expect(result).toEqual(mockPost)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO community_posts'),
        ['user-1', 'Test post', null]
      )
    })
  })

  describe('findAllPosts', () => {
    it('should find all public posts', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'Post 1',
          user_has_liked: false
        },
        {
          id: '2',
          content: 'Post 2',
          user_has_liked: true
        }
      ]

      pool.query.mockResolvedValue({ rows: mockPosts })

      const result = await Post.findAllPosts({ page: 1, limit: 20, userId: 'user-1' })

      expect(result).toEqual(mockPosts)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('findPostById', () => {
    it('should find a post by id', async () => {
      const mockPost = {
        id: '123',
        content: 'Test post',
        user_has_liked: false
      }

      pool.query.mockResolvedValue({ rows: [mockPost] })

      const result = await Post.findPostById('123', 'user-1')

      expect(result).toEqual(mockPost)
    })
  })

  describe('updatePost', () => {
    it('should update a post', async () => {
      const mockPost = {
        id: '123',
        content: 'Updated post'
      }

      pool.query.mockResolvedValue({ rows: [mockPost] })

      const result = await Post.updatePost('123', { content: 'Updated post' })

      expect(result).toEqual(mockPost)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE community_posts'),
        expect.any(Array)
      )
    })
  })

  describe('deletePost', () => {
    it('should delete a post', async () => {
      const mockPost = { id: '123' }

      pool.query.mockResolvedValue({ rows: [mockPost] })

      const result = await Post.deletePost('123')

      expect(result).toEqual(mockPost)
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM community_posts WHERE id = $1 RETURNING *',
        ['123']
      )
    })
  })

  describe('incrementLikes', () => {
    it('should increment likes count', async () => {
      const mockPost = { id: '123', likes_count: 5 }

      pool.query.mockResolvedValue({ rows: [mockPost] })

      const result = await Post.incrementLikes('123')

      expect(result).toEqual(mockPost)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('likes_count = likes_count + 1'),
        ['123']
      )
    })
  })

  describe('findFeedPosts', () => {
    it('should find posts from followed users', async () => {
      const mockPosts = [
        { id: '1', content: 'Feed post 1' },
        { id: '2', content: 'Feed post 2' }
      ]

      pool.query.mockResolvedValue({ rows: mockPosts })

      const result = await Post.findFeedPosts('user-1', { page: 1, limit: 20 })

      expect(result).toEqual(mockPosts)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('user_follows'),
        expect.any(Array)
      )
    })
  })
})
