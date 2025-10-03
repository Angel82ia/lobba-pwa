import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as PostLike from '../../src/models/PostLike.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('PostLike Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('likePost', () => {
    it('should create a new like', async () => {
      const mockLike = {
        id: '123',
        post_id: 'post-1',
        user_id: 'user-1',
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockLike] })

      const result = await PostLike.likePost({
        postId: 'post-1',
        userId: 'user-1'
      })

      expect(result).toEqual(mockLike)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_likes'),
        ['post-1', 'user-1']
      )
    })

    it('should return null on duplicate like', async () => {
      const error = new Error('Duplicate')
      error.code = '23505'
      pool.query.mockRejectedValue(error)

      const result = await PostLike.likePost({
        postId: 'post-1',
        userId: 'user-1'
      })

      expect(result).toBeNull()
    })
  })

  describe('unlikePost', () => {
    it('should remove a like', async () => {
      const mockLike = { id: '123' }

      pool.query.mockResolvedValue({ rows: [mockLike] })

      const result = await PostLike.unlikePost({
        postId: 'post-1',
        userId: 'user-1'
      })

      expect(result).toEqual(mockLike)
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *',
        ['post-1', 'user-1']
      )
    })
  })

  describe('hasUserLikedPost', () => {
    it('should return true if user liked post', async () => {
      pool.query.mockResolvedValue({ rows: [{ liked: true }] })

      const result = await PostLike.hasUserLikedPost('post-1', 'user-1')

      expect(result).toBe(true)
    })

    it('should return false if user has not liked post', async () => {
      pool.query.mockResolvedValue({ rows: [{ liked: false }] })

      const result = await PostLike.hasUserLikedPost('post-1', 'user-1')

      expect(result).toBe(false)
    })
  })

  describe('findLikesByPostId', () => {
    it('should find likes for a post', async () => {
      const mockLikes = [
        { id: '1', user_id: 'user-1', first_name: 'John', last_name: 'Doe' },
        { id: '2', user_id: 'user-2', first_name: 'Jane', last_name: 'Smith' }
      ]

      pool.query.mockResolvedValue({ rows: mockLikes })

      const result = await PostLike.findLikesByPostId('post-1')

      expect(result).toEqual(mockLikes)
    })
  })
})
