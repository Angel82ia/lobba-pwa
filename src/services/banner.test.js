import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getActiveBanners, 
  getAllBanners, 
  getBannerById, 
  createBanner, 
  updateBanner, 
  deleteBanner, 
  toggleBannerActive 
} from './banner'
import apiClient from './api'

vi.mock('./api')

describe('Banner Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getActiveBanners', () => {
    it('should get active banners', async () => {
      const mockResponse = {
        data: [
          { id: '1', title: 'Banner 1', is_active: true },
          { id: '2', title: 'Banner 2', is_active: true }
        ]
      }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      const result = await getActiveBanners()
      
      expect(apiClient.get).toHaveBeenCalledWith('/banners/active')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getAllBanners', () => {
    it('should get all banners with default params', async () => {
      const mockResponse = { data: [{ id: '1', title: 'Banner 1' }] }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      const result = await getAllBanners()
      
      expect(apiClient.get).toHaveBeenCalledWith('/banners', {
        params: { page: 1, limit: 50 }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should get all banners with custom params', async () => {
      const mockResponse = { data: [] }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      await getAllBanners(2, 10)
      
      expect(apiClient.get).toHaveBeenCalledWith('/banners', {
        params: { page: 2, limit: 10 }
      })
    })
  })

  describe('getBannerById', () => {
    it('should get banner by id', async () => {
      const mockResponse = { data: { id: '1', title: 'Test Banner' } }
      
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)
      
      const result = await getBannerById('1')
      
      expect(apiClient.get).toHaveBeenCalledWith('/banners/1')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('createBanner', () => {
    it('should create banner', async () => {
      const bannerData = {
        title: 'New Banner',
        content: 'Banner content',
        type: 'announcement'
      }
      const mockResponse = { data: { id: '1', ...bannerData } }
      
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)
      
      const result = await createBanner(bannerData)
      
      expect(apiClient.post).toHaveBeenCalledWith('/banners', bannerData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('updateBanner', () => {
    it('should update banner', async () => {
      const updates = { title: 'Updated Title' }
      const mockResponse = { data: { id: '1', title: 'Updated Title' } }
      
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse)
      
      const result = await updateBanner('1', updates)
      
      expect(apiClient.put).toHaveBeenCalledWith('/banners/1', updates)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('deleteBanner', () => {
    it('should delete banner', async () => {
      const mockResponse = { data: { message: 'Banner eliminado correctamente' } }
      
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse)
      
      const result = await deleteBanner('1')
      
      expect(apiClient.delete).toHaveBeenCalledWith('/banners/1')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('toggleBannerActive', () => {
    it('should toggle banner active status', async () => {
      const mockResponse = { data: { id: '1', is_active: false } }
      
      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse)
      
      const result = await toggleBannerActive('1')
      
      expect(apiClient.patch).toHaveBeenCalledWith('/banners/1/toggle')
      expect(result).toEqual(mockResponse.data)
    })
  })
})
