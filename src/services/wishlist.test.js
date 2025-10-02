import { describe, it, expect, vi } from 'vitest'
import * as wishlistService from './wishlist'
import apiClient from './api'

vi.mock('./api')

describe('Wishlist Service', () => {
  it('should fetch wishlist', async () => {
    const mockWishlist = [{ id: '1', product_id: 'prod-1' }]
    apiClient.get.mockResolvedValue({ data: mockWishlist })

    const result = await wishlistService.getWishlist()

    expect(result).toEqual(mockWishlist)
  })

  it('should add to wishlist', async () => {
    const mockItem = { id: '1', product_id: 'prod-1' }
    apiClient.post.mockResolvedValue({ data: mockItem })

    const result = await wishlistService.addToWishlist('prod-1')

    expect(result).toEqual(mockItem)
  })

  it('should remove from wishlist', async () => {
    apiClient.delete.mockResolvedValue({ data: { message: 'Removed' } })

    const result = await wishlistService.removeFromWishlist('prod-1')

    expect(result).toBeDefined()
  })
})
