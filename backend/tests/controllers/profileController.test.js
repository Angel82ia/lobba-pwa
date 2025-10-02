import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { body } from 'express-validator'
import * as profileController from '../../src/controllers/profileController.js'
import * as User from '../../src/models/User.js'

vi.mock('../../src/models/User.js')

const app = express()
app.use(express.json())

const mockAuth = (req, res, next) => {
  req.user = { id: 'user-123', role: 'user' }
  next()
}

const mockAdminAuth = (req, res, next) => {
  req.user = { id: 'admin-123', role: 'admin' }
  next()
}

app.get('/profile/client/:id?', mockAuth, profileController.getProfile)
app.put(
  '/profile/client',
  mockAuth,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('bio').optional().trim(),
    body('avatar').optional().isURL(),
  ],
  profileController.updateProfile
)
app.delete('/profile/client', mockAuth, profileController.deleteProfile)

describe('ProfileController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /profile/client/:id?', () => {
    it('should get own profile when no ID provided', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        membership_active: true,
        membership_status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
      }

      User.findUserById.mockResolvedValue(mockUser)

      const response = await request(app).get('/profile/client')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        membershipActive: true,
        membershipStatus: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
      })
      expect(User.findUserById).toHaveBeenCalledWith('user-123')
    })

    it('should get specific user profile by ID if requester is admin', async () => {
      const mockUser = {
        id: 'other-user',
        email: 'other@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
        avatar: null,
        bio: null,
        membership_active: false,
        membership_status: 'inactive',
        created_at: '2024-01-01T00:00:00.000Z',
      }

      User.findUserById.mockResolvedValue(mockUser)

      const adminApp = express()
      adminApp.use(express.json())
      adminApp.get('/profile/client/:id?', mockAdminAuth, profileController.getProfile)

      const response = await request(adminApp).get('/profile/client/other-user')

      expect(response.status).toBe(200)
      expect(response.body.id).toBe('other-user')
      expect(User.findUserById).toHaveBeenCalledWith('other-user')
    })

    it('should return 403 if non-admin tries to view another user profile', async () => {
      const response = await request(app).get('/profile/client/other-user')

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
      expect(User.findUserById).not.toHaveBeenCalled()
    })

    it('should return 404 if user not found', async () => {
      User.findUserById.mockResolvedValue(null)

      const response = await request(app).get('/profile/client')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('User not found')
    })

    it('should handle errors', async () => {
      User.findUserById.mockRejectedValue(new Error('Database error'))

      const response = await request(app).get('/profile/client')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to fetch profile')
    })
  })

  describe('PUT /profile/client', () => {
    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Updated',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
      }

      User.updateUser.mockResolvedValue(mockUpdatedUser)

      const response = await request(app)
        .put('/profile/client')
        .send({
          firstName: 'John',
          lastName: 'Updated',
          avatar: 'https://example.com/new-avatar.jpg',
          bio: 'Updated bio',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Updated',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
      })
      expect(User.updateUser).toHaveBeenCalledWith('user-123', {
        first_name: 'John',
        last_name: 'Updated',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Updated bio',
      })
    })

    it('should validate avatar URL format', async () => {
      const response = await request(app)
        .put('/profile/client')
        .send({
          firstName: 'John',
          avatar: 'not-a-url',
        })

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })

    it('should handle update errors', async () => {
      User.updateUser.mockRejectedValue(new Error('Update failed'))

      const response = await request(app)
        .put('/profile/client')
        .send({ firstName: 'John' })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to update profile')
    })
  })

  describe('DELETE /profile/client', () => {
    it('should anonymize user data (RGPD compliance)', async () => {
      const mockAnonymizedUser = {
        id: 'user-123',
        email: 'anonymized-user-123@deleted.local',
        first_name: 'Deleted',
        last_name: 'User',
        is_active: false,
      }

      User.updateUser.mockResolvedValue(mockAnonymizedUser)

      const response = await request(app).delete('/profile/client')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Profile deleted successfully')
      expect(User.updateUser).toHaveBeenCalledWith('user-123', {
        email: expect.stringContaining('anonymized-user-123@deleted.local'),
        first_name: 'Deleted',
        last_name: 'User',
        avatar: null,
        bio: null,
        is_active: false,
      })
    })

    it('should handle deletion errors', async () => {
      User.updateUser.mockRejectedValue(new Error('Deletion failed'))

      const response = await request(app).delete('/profile/client')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to delete profile')
    })
  })
})
