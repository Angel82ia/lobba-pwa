import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as catalogController from '../../src/controllers/catalogController.js'
import * as AICatalog from '../../src/models/AICatalog.js'
import * as DesignRating from '../../src/models/DesignRating.js'
import * as AIGeneration from '../../src/models/AIGeneration.js'

vi.mock('../../src/models/AICatalog.js')
vi.mock('../../src/models/DesignRating.js')
vi.mock('../../src/models/AIGeneration.js')

describe('Catalog Controller', () => {
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

  describe('getPublicCatalog', () => {
    it('should get public catalog with filters', async () => {
      req.query = { type: 'nails', tags: 'pink,floral', page: 1, limit: 20, sortBy: 'popular' }
      const mockItems = [{ id: '1' }, { id: '2' }]
      
      AICatalog.findPublicCatalog.mockResolvedValue(mockItems)

      await catalogController.getPublicCatalog(req, res)

      expect(AICatalog.findPublicCatalog).toHaveBeenCalledWith({
        type: 'nails',
        tags: ['pink', 'floral'],
        page: 1,
        limit: 20,
        sortBy: 'popular'
      })
      expect(res.json).toHaveBeenCalledWith(mockItems)
    })
  })

  describe('getCatalogItemDetail', () => {
    it('should get catalog item with ratings', async () => {
      req.params = { id: 'item-1' }
      const mockItem = { id: 'item-1', name: 'Pink Nails' }
      const mockRatingStats = { averageRating: 4.5, ratingCount: 10 }
      const mockDistribution = { 5: 6, 4: 3, 3: 1, 2: 0, 1: 0 }
      const mockUserRating = { rating: 5, comment: 'Great!' }
      
      AICatalog.findCatalogItemById.mockResolvedValue(mockItem)
      DesignRating.getAverageRating.mockResolvedValue(mockRatingStats)
      DesignRating.getRatingDistribution.mockResolvedValue(mockDistribution)
      DesignRating.findUserRating.mockResolvedValue(mockUserRating)

      await catalogController.getCatalogItemDetail(req, res)

      expect(res.json).toHaveBeenCalledWith({
        ...mockItem,
        ...mockRatingStats,
        ratingDistribution: mockDistribution,
        userRating: mockUserRating
      })
    })

    it('should return 404 if item not found', async () => {
      req.params = { id: 'item-1' }
      AICatalog.findCatalogItemById.mockResolvedValue(null)

      await catalogController.getCatalogItemDetail(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('rateDesign', () => {
    it('should create a new rating', async () => {
      req.params = { id: 'item-1' }
      req.body = { rating: 5, comment: 'Amazing!' }
      const mockItem = { id: 'item-1' }
      const mockRating = { id: 'rating-1', rating: 5 }
      
      AICatalog.findCatalogItemById.mockResolvedValue(mockItem)
      DesignRating.findUserRating.mockResolvedValue(null)
      DesignRating.createRating.mockResolvedValue(mockRating)

      await catalogController.rateDesign(req, res)

      expect(DesignRating.createRating).toHaveBeenCalledWith({
        catalogItemId: 'item-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Amazing!'
      })
      expect(res.json).toHaveBeenCalledWith(mockRating)
    })

    it('should update existing rating', async () => {
      req.params = { id: 'item-1' }
      req.body = { rating: 4, comment: 'Good' }
      const mockItem = { id: 'item-1' }
      const existingRating = { id: 'rating-1', rating: 5 }
      const updatedRating = { id: 'rating-1', rating: 4, comment: 'Good' }
      
      AICatalog.findCatalogItemById.mockResolvedValue(mockItem)
      DesignRating.findUserRating.mockResolvedValue(existingRating)
      DesignRating.updateRating.mockResolvedValue(updatedRating)

      await catalogController.rateDesign(req, res)

      expect(DesignRating.updateRating).toHaveBeenCalledWith('rating-1', {
        rating: 4,
        comment: 'Good'
      })
      expect(res.json).toHaveBeenCalledWith(updatedRating)
    })

    it('should return 400 for invalid rating', async () => {
      req.params = { id: 'item-1' }
      req.body = { rating: 6 }

      await catalogController.rateDesign(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('shareDesignToPublic', () => {
    it('should share design to public catalog', async () => {
      req.params = { generationId: 'gen-1' }
      const mockGeneration = {
        id: 'gen-1',
        user_id: 'user-1',
        type: 'nails',
        prompt: 'Pink floral nails',
        output_image_url: '/image.png'
      }
      const mockCatalogItem = { id: 'item-1' }
      
      AIGeneration.findGenerationById.mockResolvedValue(mockGeneration)
      AICatalog.findCatalogItemByStyleId.mockResolvedValue(null)
      AICatalog.createCatalogItem.mockResolvedValue(mockCatalogItem)

      await catalogController.shareDesignToPublic(req, res)

      expect(AICatalog.createCatalogItem).toHaveBeenCalledWith({
        type: 'nails',
        styleId: 'gen-1',
        name: 'Pink floral nails',
        description: 'Pink floral nails',
        previewImageUrl: '/image.png',
        tags: []
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCatalogItem)
    })

    it('should return 403 if not owner', async () => {
      req.params = { generationId: 'gen-1' }
      const mockGeneration = { id: 'gen-1', user_id: 'other-user' }
      
      AIGeneration.findGenerationById.mockResolvedValue(mockGeneration)

      await catalogController.shareDesignToPublic(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 400 if already shared', async () => {
      req.params = { generationId: 'gen-1' }
      const mockGeneration = { id: 'gen-1', user_id: 'user-1' }
      const mockExisting = { id: 'item-1' }
      
      AIGeneration.findGenerationById.mockResolvedValue(mockGeneration)
      AICatalog.findCatalogItemByStyleId.mockResolvedValue(mockExisting)

      await catalogController.shareDesignToPublic(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Este diseño ya está en el catálogo público'
      })
    })
  })

  describe('getDesignRatings', () => {
    it('should get ratings for a design', async () => {
      req.params = { id: 'item-1' }
      req.query = { page: 1, limit: 20 }
      const mockRatings = [{ id: '1' }, { id: '2' }]
      
      DesignRating.findRatingsByCatalogItem.mockResolvedValue(mockRatings)

      await catalogController.getDesignRatings(req, res)

      expect(DesignRating.findRatingsByCatalogItem).toHaveBeenCalledWith('item-1', {
        page: 1,
        limit: 20
      })
      expect(res.json).toHaveBeenCalledWith(mockRatings)
    })
  })
})
