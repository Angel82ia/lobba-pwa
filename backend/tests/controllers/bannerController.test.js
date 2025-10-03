import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as bannerController from '../../src/controllers/bannerController.js'
import * as Banner from '../../src/models/Banner.js'

vi.mock('../../src/models/Banner.js')

describe('BannerController', () => {
  let req, res
  const mockUserId = 'user-123'
  const mockBannerId = 'banner-123'

  beforeEach(() => {
    req = {
      user: { id: mockUserId },
      body: {},
      params: {},
      query: {}
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('createBanner', () => {
    beforeEach(() => {
      req.body = {
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement',
        imageUrl: 'https://example.com/image.jpg',
        priority: 5
      }
      
      vi.mocked(Banner.createBanner).mockResolvedValue({
        id: mockBannerId,
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement'
      })
    })

    it('should create banner successfully', async () => {
      await bannerController.createBanner(req, res)
      
      expect(Banner.createBanner).toHaveBeenCalledWith({
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement',
        imageUrl: 'https://example.com/image.jpg',
        priority: 5,
        startDate: null,
        endDate: null,
        createdBy: mockUserId
      })
      
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        id: mockBannerId,
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement'
      })
    })

    it('should return error for missing required fields', async () => {
      req.body = { title: 'Test' }
      
      await bannerController.createBanner(req, res)
      
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Título, contenido y tipo son requeridos' })
    })

    it('should return error for invalid type', async () => {
      req.body = {
        title: 'Test Banner',
        content: 'Test content',
        type: 'invalid-type'
      }
      
      await bannerController.createBanner(req, res)
      
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Tipo de banner inválido' })
    })
  })

  describe('getActiveBanners', () => {
    it('should return active banners', async () => {
      const mockBanners = [
        { id: '1', title: 'Banner 1', is_active: true },
        { id: '2', title: 'Banner 2', is_active: true }
      ]
      
      vi.mocked(Banner.findActiveBanners).mockResolvedValue(mockBanners)
      
      await bannerController.getActiveBanners(req, res)
      
      expect(res.json).toHaveBeenCalledWith(mockBanners)
    })

    it('should handle errors', async () => {
      vi.mocked(Banner.findActiveBanners).mockRejectedValue(new Error('DB Error'))
      
      await bannerController.getActiveBanners(req, res)
      
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'DB Error' })
    })
  })

  describe('getAllBanners', () => {
    it('should return paginated banners', async () => {
      const mockBanners = [{ id: '1', title: 'Banner 1' }]
      req.query = { page: '2', limit: '10' }
      
      vi.mocked(Banner.findAllBanners).mockResolvedValue(mockBanners)
      
      await bannerController.getAllBanners(req, res)
      
      expect(Banner.findAllBanners).toHaveBeenCalledWith({ page: 2, limit: 10 })
      expect(res.json).toHaveBeenCalledWith(mockBanners)
    })
  })

  describe('getBannerById', () => {
    beforeEach(() => {
      req.params = { id: mockBannerId }
    })

    it('should return banner by id', async () => {
      const mockBanner = { id: mockBannerId, title: 'Test Banner' }
      vi.mocked(Banner.findBannerById).mockResolvedValue(mockBanner)
      
      await bannerController.getBannerById(req, res)
      
      expect(res.json).toHaveBeenCalledWith(mockBanner)
    })

    it('should return 404 for non-existent banner', async () => {
      vi.mocked(Banner.findBannerById).mockResolvedValue(null)
      
      await bannerController.getBannerById(req, res)
      
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Banner no encontrado' })
    })
  })

  describe('updateBanner', () => {
    beforeEach(() => {
      req.params = { id: mockBannerId }
      req.body = { title: 'Updated Title' }
    })

    it('should update banner successfully', async () => {
      const mockBanner = { id: mockBannerId, title: 'Original Title' }
      const updatedBanner = { id: mockBannerId, title: 'Updated Title' }
      
      vi.mocked(Banner.findBannerById).mockResolvedValue(mockBanner)
      vi.mocked(Banner.updateBanner).mockResolvedValue(updatedBanner)
      
      await bannerController.updateBanner(req, res)
      
      expect(Banner.updateBanner).toHaveBeenCalledWith(mockBannerId, { title: 'Updated Title' })
      expect(res.json).toHaveBeenCalledWith(updatedBanner)
    })

    it('should return 404 for non-existent banner', async () => {
      vi.mocked(Banner.findBannerById).mockResolvedValue(null)
      
      await bannerController.updateBanner(req, res)
      
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Banner no encontrado' })
    })
  })

  describe('deleteBanner', () => {
    beforeEach(() => {
      req.params = { id: mockBannerId }
    })

    it('should delete banner successfully', async () => {
      const mockBanner = { id: mockBannerId, title: 'Test Banner' }
      vi.mocked(Banner.findBannerById).mockResolvedValue(mockBanner)
      vi.mocked(Banner.deleteBanner).mockResolvedValue(mockBanner)
      
      await bannerController.deleteBanner(req, res)
      
      expect(Banner.deleteBanner).toHaveBeenCalledWith(mockBannerId)
      expect(res.json).toHaveBeenCalledWith({ message: 'Banner eliminado correctamente' })
    })

    it('should return 404 for non-existent banner', async () => {
      vi.mocked(Banner.findBannerById).mockResolvedValue(null)
      
      await bannerController.deleteBanner(req, res)
      
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Banner no encontrado' })
    })
  })

  describe('toggleBannerActive', () => {
    beforeEach(() => {
      req.params = { id: mockBannerId }
    })

    it('should toggle banner active status', async () => {
      const toggledBanner = { id: mockBannerId, is_active: false }
      vi.mocked(Banner.toggleBannerActive).mockResolvedValue(toggledBanner)
      
      await bannerController.toggleBannerActive(req, res)
      
      expect(Banner.toggleBannerActive).toHaveBeenCalledWith(mockBannerId)
      expect(res.json).toHaveBeenCalledWith(toggledBanner)
    })

    it('should return 404 if toggle fails', async () => {
      vi.mocked(Banner.toggleBannerActive).mockResolvedValue(null)
      
      await bannerController.toggleBannerActive(req, res)
      
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Banner no encontrado' })
    })
  })
})
