import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as profileService from './profile'
import apiClient from './api'

vi.mock('./api')

describe('Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getClientProfile', () => {
    it('should fetch client profile without userId', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }

      apiClient.get.mockResolvedValue({ data: mockProfile })

      const result = await profileService.getClientProfile()

      expect(apiClient.get).toHaveBeenCalledWith('/profile/client/')
      expect(result).toEqual(mockProfile)
    })

    it('should fetch client profile with userId', async () => {
      const mockProfile = {
        id: 'user-456',
        email: 'other@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      }

      apiClient.get.mockResolvedValue({ data: mockProfile })

      const result = await profileService.getClientProfile('user-456')

      expect(apiClient.get).toHaveBeenCalledWith('/profile/client/user-456')
      expect(result).toEqual(mockProfile)
    })
  })

  describe('updateClientProfile', () => {
    it('should update client profile', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Updated',
        bio: 'New bio',
      }

      const mockResponse = {
        id: 'user-123',
        ...profileData,
      }

      apiClient.put.mockResolvedValue({ data: mockResponse })

      const result = await profileService.updateClientProfile(profileData)

      expect(apiClient.put).toHaveBeenCalledWith('/profile/client', profileData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSalonProfile', () => {
    it('should fetch salon profile by id', async () => {
      const mockSalon = {
        id: 'salon-123',
        businessName: 'Test Salon',
        rating: 4.5,
      }

      apiClient.get.mockResolvedValue({ data: mockSalon })

      const result = await profileService.getSalonProfile('salon-123')

      expect(apiClient.get).toHaveBeenCalledWith('/salon/salon-123', { signal: null })
      expect(result).toEqual(mockSalon)
    })
  })

  describe('updateSalonProfile', () => {
    it('should update salon profile', async () => {
      const profileData = {
        businessName: 'Updated Salon',
        description: 'New description',
      }

      const mockResponse = {
        id: 'salon-123',
        ...profileData,
      }

      apiClient.put.mockResolvedValue({ data: mockResponse })

      const result = await profileService.updateSalonProfile('salon-123', profileData)

      expect(apiClient.put).toHaveBeenCalledWith('/salon/salon-123', profileData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSalonServices', () => {
    it('should fetch salon services', async () => {
      const mockServices = [
        { id: 'svc-1', name: 'Haircut', price: 25 },
        { id: 'svc-2', name: 'Coloring', price: 75 },
      ]

      apiClient.get.mockResolvedValue({ data: mockServices })

      const result = await profileService.getSalonServices('salon-123')

      expect(apiClient.get).toHaveBeenCalledWith('/salon/salon-123/services', { signal: null })
      expect(result).toEqual(mockServices)
    })
  })

  describe('createSalonService', () => {
    it('should create salon service', async () => {
      const serviceData = {
        name: 'Manicure',
        price: 30,
        durationMinutes: 45,
      }

      const mockResponse = {
        id: 'svc-3',
        ...serviceData,
      }

      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await profileService.createSalonService('salon-123', serviceData)

      expect(apiClient.post).toHaveBeenCalledWith('/salon/salon-123/services', serviceData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadSalonImage', () => {
    it('should upload salon image', async () => {
      const mockFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse = {
        id: 'img-1',
        cloudinaryUrl: 'https://cloudinary.com/image.jpg',
      }

      apiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await profileService.uploadSalonImage('salon-123', mockFile)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/salon/salon-123/gallery',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSalonCategories', () => {
    it('should fetch all salon categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Belleza', slug: 'belleza' },
        { id: 'cat-2', name: 'Peluquería', slug: 'peluqueria' },
      ]

      apiClient.get.mockResolvedValue({ data: mockCategories })

      const result = await profileService.getSalonCategories()

      expect(apiClient.get).toHaveBeenCalledWith('/salon/categories')
      expect(result).toEqual(mockCategories)
    })
  })
})
