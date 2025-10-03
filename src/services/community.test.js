import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as communityService from './community'
import apiClient from './api'

vi.mock('./api')

describe('Community Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPost', () => {
    it('should create a new post', async () => {
      const mockPost = { id: '1', content: 'Test post' }
      apiClient.post.mockResolvedValue({ data: mockPost })

      const result = await communityService.createPost({ content: 'Test post' })

      expect(apiClient.post).toHaveBeenCalledWith('/posts', { content: 'Test post' })
      expect(result).toEqual(mockPost)
    })
  })

  describe('getFeed', () => {
    it('should get user feed', async () => {
      const mockPosts = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockPosts })

      const result = await communityService.getFeed(1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/posts/feed', { params: { page: 1, limit: 20 } })
      expect(result).toEqual(mockPosts)
    })
  })

  describe('likePost', () => {
    it('should like a post', async () => {
      const mockResponse = { message: 'Liked' }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await communityService.likePost('post-1')

      expect(apiClient.post).toHaveBeenCalledWith('/posts/post-1/like')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createComment', () => {
    it('should create a comment', async () => {
      const mockComment = { id: '1', content: 'Test comment' }
      apiClient.post.mockResolvedValue({ data: mockComment })

      const result = await communityService.createComment('post-1', 'Test comment')

      expect(apiClient.post).toHaveBeenCalledWith('/comments', { postId: 'post-1', content: 'Test comment' })
      expect(result).toEqual(mockComment)
    })
  })

  describe('followUser', () => {
    it('should follow a user', async () => {
      const mockResponse = { message: 'Followed' }
      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await communityService.followUser('user-1')

      expect(apiClient.post).toHaveBeenCalledWith('/community/follow/user-1')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      const mockProfile = { user: { id: 'user-1' }, stats: {} }
      apiClient.get.mockResolvedValue({ data: mockProfile })

      const result = await communityService.getUserProfile('user-1')

      expect(apiClient.get).toHaveBeenCalledWith('/community/profile/user-1')
      expect(result).toEqual(mockProfile)
    })
  })
})
