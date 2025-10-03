import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Comment from '../../src/models/Comment.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('Comment Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const mockComment = {
        id: '123',
        post_id: 'post-1',
        user_id: 'user-1',
        content: 'Test comment',
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockComment] })

      const result = await Comment.createComment({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Test comment'
      })

      expect(result).toEqual(mockComment)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_comments'),
        ['post-1', 'user-1', 'Test comment']
      )
    })
  })

  describe('findCommentsByPostId', () => {
    it('should find comments for a post', async () => {
      const mockComments = [
        { id: '1', content: 'Comment 1', first_name: 'John', last_name: 'Doe' },
        { id: '2', content: 'Comment 2', first_name: 'Jane', last_name: 'Smith' }
      ]

      pool.query.mockResolvedValue({ rows: mockComments })

      const result = await Comment.findCommentsByPostId('post-1', { page: 1, limit: 50 })

      expect(result).toEqual(mockComments)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.post_id = $1'),
        expect.arrayContaining(['post-1'])
      )
    })
  })

  describe('findCommentById', () => {
    it('should find a comment by id', async () => {
      const mockComment = {
        id: '123',
        content: 'Test comment',
        first_name: 'John',
        last_name: 'Doe'
      }

      pool.query.mockResolvedValue({ rows: [mockComment] })

      const result = await Comment.findCommentById('123')

      expect(result).toEqual(mockComment)
    })
  })

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const mockComment = { id: '123', post_id: 'post-1' }

      pool.query.mockResolvedValue({ rows: [mockComment] })

      const result = await Comment.deleteComment('123')

      expect(result).toEqual(mockComment)
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM post_comments WHERE id = $1 RETURNING *',
        ['123']
      )
    })
  })
})
