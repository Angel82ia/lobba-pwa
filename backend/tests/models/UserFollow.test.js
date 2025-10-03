import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as UserFollow from '../../src/models/UserFollow.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('UserFollow Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('followUser', () => {
    it('should create a new follow', async () => {
      const mockFollow = {
        id: '123',
        follower_id: 'user-1',
        following_id: 'user-2',
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockFollow] })

      const result = await UserFollow.followUser({
        followerId: 'user-1',
        followingId: 'user-2'
      })

      expect(result).toEqual(mockFollow)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_follows'),
        ['user-1', 'user-2']
      )
    })

    it('should throw error if trying to follow self', async () => {
      await expect(
        UserFollow.followUser({
          followerId: 'user-1',
          followingId: 'user-1'
        })
      ).rejects.toThrow('Cannot follow yourself')
    })

    it('should return null on duplicate follow', async () => {
      const error = new Error('Duplicate')
      error.code = '23505'
      pool.query.mockRejectedValue(error)

      const result = await UserFollow.followUser({
        followerId: 'user-1',
        followingId: 'user-2'
      })

      expect(result).toBeNull()
    })
  })

  describe('unfollowUser', () => {
    it('should remove a follow', async () => {
      const mockFollow = { id: '123' }

      pool.query.mockResolvedValue({ rows: [mockFollow] })

      const result = await UserFollow.unfollowUser({
        followerId: 'user-1',
        followingId: 'user-2'
      })

      expect(result).toEqual(mockFollow)
    })
  })

  describe('isFollowing', () => {
    it('should return true if following', async () => {
      pool.query.mockResolvedValue({ rows: [{ following: true }] })

      const result = await UserFollow.isFollowing('user-1', 'user-2')

      expect(result).toBe(true)
    })

    it('should return false if not following', async () => {
      pool.query.mockResolvedValue({ rows: [{ following: false }] })

      const result = await UserFollow.isFollowing('user-1', 'user-2')

      expect(result).toBe(false)
    })
  })

  describe('getFollowerCount', () => {
    it('should return follower count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '10' }] })

      const result = await UserFollow.getFollowerCount('user-1')

      expect(result).toBe(10)
    })
  })

  describe('getFollowingCount', () => {
    it('should return following count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '5' }] })

      const result = await UserFollow.getFollowingCount('user-1')

      expect(result).toBe(5)
    })
  })

  describe('findFollowers', () => {
    it('should find followers', async () => {
      const mockFollowers = [
        { id: 'user-1', first_name: 'John', last_name: 'Doe' },
        { id: 'user-2', first_name: 'Jane', last_name: 'Smith' }
      ]

      pool.query.mockResolvedValue({ rows: mockFollowers })

      const result = await UserFollow.findFollowers('user-3')

      expect(result).toEqual(mockFollowers)
    })
  })

  describe('findFollowing', () => {
    it('should find following', async () => {
      const mockFollowing = [
        { id: 'user-2', first_name: 'Jane', last_name: 'Smith' }
      ]

      pool.query.mockResolvedValue({ rows: mockFollowing })

      const result = await UserFollow.findFollowing('user-1')

      expect(result).toEqual(mockFollowing)
    })
  })
})
