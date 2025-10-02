import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { body } from 'express-validator'
import * as salonProfileController from '../../src/controllers/salonProfileController.js'
import * as SalonProfile from '../../src/models/SalonProfile.js'
import * as SalonService from '../../src/models/SalonService.js'
import * as SalonCategory from '../../src/models/SalonCategory.js'

vi.mock('../../src/models/SalonProfile.js')
vi.mock('../../src/models/SalonService.js', () => ({
  findServicesBySalonId: vi.fn(),
  createSalonService: vi.fn(),
}))
vi.mock('../../src/models/SalonCategory.js')

const app = express()
app.use(express.json())

const mockSalonAuth = (req, res, next) => {
  req.user = { id: 'salon-user-123', role: 'salon' }
  next()
}

const mockAdminAuth = (req, res, next) => {
  req.user = { id: 'admin-123', role: 'admin' }
  next()
}

app.get('/salon/categories', salonProfileController.getAllCategories)
app.get('/salon/:id', salonProfileController.getSalonProfile)
app.post(
  '/salon',
  mockSalonAuth,
  [
    body('businessName').trim().isLength({ min: 1 }),
    body('description').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('phone').optional().trim(),
  ],
  salonProfileController.createSalonProfile
)
app.put(
  '/salon/:id',
  mockSalonAuth,
  [
    body('businessName').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim(),
  ],
  salonProfileController.updateSalonProfile
)
app.delete('/salon/:id', mockSalonAuth, salonProfileController.deleteSalonProfile)

app.get('/salon/:id/services', salonProfileController.getSalonServices)
app.post(
  '/salon/:id/services',
  mockSalonAuth,
  [
    body('name').trim().isLength({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('durationMinutes').isInt({ min: 1 }),
  ],
  salonProfileController.createSalonService
)

app.post(
  '/salon/:id/categories',
  mockSalonAuth,
  salonProfileController.assignCategory
)

describe('SalonProfileController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /salon/:id', () => {
    it('should get salon profile by ID (public access)', async () => {
      const mockProfile = {
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
        business_name: 'Beauty Salon',
        description: 'Best salon in town',
        address: 'Calle Mayor 1',
        city: 'Madrid',
        phone: '+34 600 000 000',
        latitude: 40.416775,
        longitude: -3.703790,
        rating: 4.5,
        total_reviews: 10,
        is_active: true,
      }

      SalonProfile.findSalonProfileById.mockResolvedValue(mockProfile)

      const response = await request(app).get('/salon/salon-profile-123')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'salon-profile-123',
        userId: 'salon-user-123',
        businessName: 'Beauty Salon',
        description: 'Best salon in town',
        address: 'Calle Mayor 1',
        city: 'Madrid',
        phone: '+34 600 000 000',
        location: {
          latitude: 40.416775,
          longitude: -3.703790,
        },
        rating: 4.5,
        totalReviews: 10,
        isActive: true,
      })
    })

    it('should return 404 if salon profile not found', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue(null)

      const response = await request(app).get('/salon/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Salon profile not found')
    })

    it('should handle errors', async () => {
      SalonProfile.findSalonProfileById.mockRejectedValue(new Error('Database error'))

      const response = await request(app).get('/salon/salon-profile-123')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to fetch salon profile')
    })
  })

  describe('POST /salon', () => {
    it('should create salon profile for salon role user', async () => {
      const mockProfile = {
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
        business_name: 'New Salon',
        description: 'A new salon',
        address: 'Calle Nueva 5',
        city: 'Barcelona',
        created_at: '2024-01-01T00:00:00.000Z',
      }

      SalonProfile.findSalonProfileByUserId.mockResolvedValue(null)
      SalonProfile.createSalonProfile.mockResolvedValue(mockProfile)

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon',
        mockSalonAuth,
        [
          body('businessName').trim().isLength({ min: 1 }),
          body('description').optional().trim(),
        ],
        salonProfileController.createSalonProfile
      )

      const response = await request(salonApp)
        .post('/salon')
        .send({
          businessName: 'New Salon',
          description: 'A new salon',
          address: 'Calle Nueva 5',
          city: 'Barcelona',
        })

      expect(response.status).toBe(201)
      expect(response.body.businessName).toBe('New Salon')
      expect(SalonProfile.createSalonProfile).toHaveBeenCalledWith({
        userId: 'salon-user-123',
        businessName: 'New Salon',
        description: 'A new salon',
        address: 'Calle Nueva 5',
        city: 'Barcelona',
        postalCode: undefined,
        phone: undefined,
        location: undefined,
        businessHours: undefined,
      })
    })

    it('should return 409 if salon profile already exists', async () => {
      SalonProfile.findSalonProfileByUserId.mockResolvedValue({ id: 'existing' })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon',
        mockSalonAuth,
        [body('businessName').trim().isLength({ min: 1 })],
        salonProfileController.createSalonProfile
      )

      const response = await request(salonApp)
        .post('/salon')
        .send({ businessName: 'New Salon' })

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('Salon profile already exists')
    })

    it('should validate required fields', async () => {
      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon',
        mockSalonAuth,
        [body('businessName').trim().isLength({ min: 1 })],
        salonProfileController.createSalonProfile
      )

      const response = await request(salonApp).post('/salon').send({})

      expect(response.status).toBe(400)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('PUT /salon/:id', () => {
    it('should update salon profile by owner', async () => {
      const mockProfile = {
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
        business_name: 'Updated Salon',
      }

      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
      })
      SalonProfile.updateSalonProfile.mockResolvedValue(mockProfile)

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.put(
        '/salon/:id',
        mockSalonAuth,
        [body('businessName').optional().trim()],
        salonProfileController.updateSalonProfile
      )

      const response = await request(salonApp)
        .put('/salon/salon-profile-123')
        .send({ businessName: 'Updated Salon' })

      expect(response.status).toBe(200)
      expect(response.body.businessName).toBe('Updated Salon')
    })

    it('should return 403 if non-owner tries to update', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'different-user',
      })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.put('/salon/:id', mockSalonAuth, salonProfileController.updateSalonProfile)

      const response = await request(salonApp)
        .put('/salon/salon-profile-123')
        .send({ businessName: 'Hacked' })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })

    it('should allow admin to update any salon', async () => {
      const mockProfile = {
        id: 'salon-profile-123',
        user_id: 'different-user',
        business_name: 'Admin Updated',
      }

      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'different-user',
      })
      SalonProfile.updateSalonProfile.mockResolvedValue(mockProfile)

      const adminApp = express()
      adminApp.use(express.json())
      adminApp.put('/salon/:id', mockAdminAuth, salonProfileController.updateSalonProfile)

      const response = await request(adminApp)
        .put('/salon/salon-profile-123')
        .send({ businessName: 'Admin Updated' })

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /salon/:id', () => {
    it('should soft delete salon profile by owner', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
      })
      SalonProfile.updateSalonProfile.mockResolvedValue({
        id: 'salon-profile-123',
        is_active: false,
      })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.delete('/salon/:id', mockSalonAuth, salonProfileController.deleteSalonProfile)

      const response = await request(salonApp).delete('/salon/salon-profile-123')

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Salon profile deleted successfully')
      expect(SalonProfile.updateSalonProfile).toHaveBeenCalledWith('salon-profile-123', {
        isActive: false,
      })
    })

    it('should return 403 if non-owner tries to delete', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'different-user',
      })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.delete('/salon/:id', mockSalonAuth, salonProfileController.deleteSalonProfile)

      const response = await request(salonApp).delete('/salon/salon-profile-123')

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })
  })

  describe('GET /salon/:id/services', () => {
    it('should get all services for a salon', async () => {
      const mockServices = [
        {
          id: 'service-1',
          salon_profile_id: 'salon-profile-123',
          name: 'Haircut',
          price: 25.00,
          duration_minutes: 30,
        },
        {
          id: 'service-2',
          salon_profile_id: 'salon-profile-123',
          name: 'Hair Color',
          price: 60.00,
          duration_minutes: 90,
        },
      ]

      SalonService.findServicesBySalonId.mockResolvedValue(mockServices)

      const response = await request(app).get('/salon/salon-profile-123/services')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0].name).toBe('Haircut')
    })
  })

  describe('POST /salon/:id/services', () => {
    it('should create a service for salon owner', async () => {
      const mockService = {
        id: 'service-123',
        salon_profile_id: 'salon-profile-123',
        name: 'New Service',
        price: 30.00,
        duration_minutes: 45,
      }

      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
      })
      SalonService.createSalonService.mockResolvedValue(mockService)

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon/:id/services',
        mockSalonAuth,
        [
          body('name').trim().isLength({ min: 1 }),
          body('price').isFloat({ min: 0 }),
          body('durationMinutes').isInt({ min: 1 }),
        ],
        salonProfileController.createSalonService
      )

      const response = await request(salonApp)
        .post('/salon/salon-profile-123/services')
        .send({
          name: 'New Service',
          price: 30.00,
          durationMinutes: 45,
        })

      expect(response.status).toBe(201)
      expect(response.body.name).toBe('New Service')
    })

    it('should return 403 if non-owner tries to create service', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'different-user',
      })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon/:id/services',
        mockSalonAuth,
        [
          body('name').trim().isLength({ min: 1 }),
          body('price').isFloat({ min: 0 }),
          body('durationMinutes').isInt({ min: 1 }),
        ],
        salonProfileController.createSalonService
      )

      const response = await request(salonApp)
        .post('/salon/salon-profile-123/services')
        .send({
          name: 'Hacked Service',
          price: 999.00,
          durationMinutes: 1,
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Forbidden')
    })
  })

  describe('GET /salon/categories', () => {
    it('should get all available categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Belleza', slug: 'belleza' },
        { id: 'cat-2', name: 'Peluquería', slug: 'peluqueria' },
      ]

      SalonCategory.findAllCategories.mockResolvedValue(mockCategories)

      const response = await request(app).get('/salon/categories')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0].name).toBe('Belleza')
    })
  })

  describe('POST /salon/:id/categories', () => {
    it('should assign category to salon by owner', async () => {
      SalonProfile.findSalonProfileById.mockResolvedValue({
        id: 'salon-profile-123',
        user_id: 'salon-user-123',
      })
      SalonCategory.assignCategoryToSalon.mockResolvedValue({
        salon_profile_id: 'salon-profile-123',
        category_id: 'cat-1',
      })

      const salonApp = express()
      salonApp.use(express.json())
      salonApp.post(
        '/salon/:id/categories',
        mockSalonAuth,
        salonProfileController.assignCategory
      )

      const response = await request(salonApp)
        .post('/salon/salon-profile-123/categories')
        .send({ categoryId: 'cat-1' })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('Category assigned successfully')
    })
  })
})
