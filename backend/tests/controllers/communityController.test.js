import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as communityController from '../../src/controllers/communityController.js'
import * as UserFollow from '../../src/models/UserFollow.js'
import * as User from '../../src/models/User.js'
import * as Post from '../../src/models/Post.js'

vi.mock('../../src/models/UserFollow.js')
vi.mock('../../src/models/User.js')
vi.mock('../../src/models/Post.js')

describe('Community Controller', () => {
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

  describe('followUser', () => {
    it('should follow a user', async () => {
      req.params = { userId: 'user-2' }
      const mockUser = { id: 'user-2', first_name: 'Jane' }
      const mockFollow = { id: 'follow-1' }
      
      User.findUserById.mockResolvedValue(mockUser)
      UserFollow.followUser.mockResolvedValue(mockFollow)

      await communityController.followUser(req, res)

      expect(UserFollow.followUser).toHaveBeenCalledWith({
        followerId: 'user-1',
        followingId: 'user-2'
      })
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario seguido correctamente'
      })
    })

    it('should return 400 if trying to follow self', async () => {
      req.params = { userId: 'user-1' }

      await communityController.followUser(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No puedes seguirte a ti mismo'
      })
    })

    it('should return 404 if user not found', async () => {
      req.params = { userId: 'user-2' }
      User.findUserById.mockResolvedValue(null)

      await communityController.followUser(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 400 if already following', async () => {
      req.params = { userId: 'user-2' }
      const mockUser = { id: 'user-2' }
      
      User.findUserById.mockResolvedValue(mockUser)
      UserFollow.followUser.mockResolvedValue(null)

      await communityController.followUser(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ya sigues a este usuario'
      })
    })
  })

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      req.params = { userId: 'user-2' }
      const mockUnfollow = { id: 'follow-1' }
      
      UserFollow.unfollowUser.mockResolvedValue(mockUnfollow)

      await communityController.unfollowUser(req, res)

      expect(UserFollow.unfollowUser).toHaveBeenCalledWith({
        followerId: 'user-1',
        followingId: 'user-2'
      })
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario dejado de seguir correctamente'
      })
    })

    it('should return 404 if not following', async () => {
      req.params = { userId: 'user-2' }
      UserFollow.unfollowUser.mockResolvedValue(null)

      await communityController.unfollowUser(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile with stats', async () => {
      req.params = { userId: 'user-2' }
      const mockUser = { id: 'user-2', first_name: 'Jane', password_hash: 'secret' }
      const mockPosts = [{ id: '1' }, { id: '2' }]
      
      User.findUserById.mockResolvedValue(mockUser)
      UserFollow.getFollowerCount.mockResolvedValue(10)
      UserFollow.getFollowingCount.mockResolvedValue(5)
      Post.findPostsByUserId.mockResolvedValue(mockPosts)
      UserFollow.isFollowing.mockResolvedValue(true)

      await communityController.getUserProfile(req, res)

      expect(res.json).toHaveBeenCalledWith({
        user: expect.not.objectContaining({ password_hash: 'secret' }),
        stats: {
          followers: 10,
          following: 5,
          posts: 2
        },
        isFollowing: true,
        recentPosts: mockPosts
      })
    })

    it('should return 404 if user not found', async () => {
      req.params = { userId: 'user-2' }
      User.findUserById.mockResolvedValue(null)

      await communityController.getUserProfile(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getFollowers', () => {
    it('should get followers list', async () => {
      req.params = { userId: 'user-2' }
      req.query = { page: 1, limit: 50 }
      const mockFollowers = [{ id: 'user-1' }, { id: 'user-3' }]
      
      UserFollow.findFollowers.mockResolvedValue(mockFollowers)

      await communityController.getFollowers(req, res)

      expect(UserFollow.findFollowers).toHaveBeenCalledWith('user-2', {
        page: 1,
        limit: 50
      })
      expect(res.json).toHaveBeenCalledWith(mockFollowers)
    })
  })

  describe('getFollowing', () => {
    it('should get following list', async () => {
      req.params = { userId: 'user-2' }
      req.query = { page: 1, limit: 50 }
      const mockFollowing = [{ id: 'user-1' }]
      
      UserFollow.findFollowing.mockResolvedValue(mockFollowing)

      await communityController.getFollowing(req, res)

      expect(UserFollow.findFollowing).toHaveBeenCalledWith('user-2', {
        page: 1,
        limit: 50
      })
      expect(res.json).toHaveBeenCalledWith(mockFollowing)
    })
  })
})
