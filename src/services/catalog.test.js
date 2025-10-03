import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as catalogService from './catalog'
import apiClient from './api'

vi.mock('./api')

describe('Catalog Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPublicCatalog', () => {
    it('should get public catalog with filters', async () => {
      const mockDesigns = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockDesigns })

      const result = await catalogService.getPublicCatalog({ type: 'nails' }, 1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/public', {
        params: { page: 1, limit: 20, type: 'nails' }
      })
      expect(result).toEqual(mockDesigns)
    })
  })

  describe('getDesignDetail', () => {
    it('should get design detail', async () => {
      const mockDesign = { id: '1', name: 'Pink Nails' }
      apiClient.get.mockResolvedValue({ data: mockDesign })

      const result = await catalogService.getDesignDetail('1')

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/1')
      expect(result).toEqual(mockDesign)
    })
  })

  describe('rateDesign', () => {
    it('should rate a design', async () => {
      const mockRating = { id: '1', rating: 5 }
      apiClient.post.mockResolvedValue({ data: mockRating })

      const result = await catalogService.rateDesign('design-1', 5, 'Great!')

      expect(apiClient.post).toHaveBeenCalledWith('/catalog/design-1/rate', {
        rating: 5,
        comment: 'Great!'
      })
      expect(result).toEqual(mockRating)
    })
  })

  describe('shareDesignToPublic', () => {
    it('should share design to public catalog', async () => {
      const mockCatalogItem = { id: 'catalog-1' }
      apiClient.post.mockResolvedValue({ data: mockCatalogItem })

      const result = await catalogService.shareDesignToPublic('gen-1')

      expect(apiClient.post).toHaveBeenCalledWith('/catalog/share/gen-1')
      expect(result).toEqual(mockCatalogItem)
    })
  })

  describe('getDesignRatings', () => {
    it('should get design ratings', async () => {
      const mockRatings = [{ id: '1' }, { id: '2' }]
      apiClient.get.mockResolvedValue({ data: mockRatings })

      const result = await catalogService.getDesignRatings('design-1', 1, 20)

      expect(apiClient.get).toHaveBeenCalledWith('/catalog/design-1/ratings', {
        params: { page: 1, limit: 20 }
      })
      expect(result).toEqual(mockRatings)
    })
  })
})
