import { describe, it, expect, vi } from 'vitest'
import * as cartService from './cart'
import apiClient from './api'

vi.mock('./api')

describe('Cart Service', () => {
  it('should fetch cart', async () => {
    const mockCart = { id: 'cart-1', items: [] }
    apiClient.get.mockResolvedValue({ data: mockCart })

    const result = await cartService.getCart()

    expect(result).toEqual(mockCart)
  })

  it('should add item to cart', async () => {
    const mockItem = { id: 'item-1', product_id: 'prod-1' }
    apiClient.post.mockResolvedValue({ data: mockItem })

    const result = await cartService.addToCart('prod-1', null, 2)

    expect(result).toEqual(mockItem)
    expect(apiClient.post).toHaveBeenCalledWith('/cart/add', {
      productId: 'prod-1',
      variantId: null,
      quantity: 2,
    })
  })

  it('should update cart item', async () => {
    const mockItem = { id: 'item-1', quantity: 5 }
    apiClient.put.mockResolvedValue({ data: mockItem })

    const result = await cartService.updateCartItem('item-1', 5)

    expect(result).toEqual(mockItem)
  })

  it('should remove item from cart', async () => {
    apiClient.delete.mockResolvedValue({ data: { message: 'Removed' } })

    const result = await cartService.removeFromCart('item-1')

    expect(result).toBeDefined()
  })
})
