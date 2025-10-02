import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Cart from '../../src/models/Cart.js'
import * as cartController from '../../src/controllers/cartController.js'

vi.mock('../../src/models/Cart.js')

describe('Cart Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 'user-123' },
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
  })

  describe('getCart', () => {
    it('should return user cart', async () => {
      const mockCart = { id: 'cart-1', user_id: 'user-123', items: [] }
      Cart.findOrCreateCart.mockResolvedValue({ id: 'cart-1' })
      Cart.getCartWithItems.mockResolvedValue(mockCart)

      await cartController.getCart(req, res)

      expect(res.json).toHaveBeenCalledWith(mockCart)
    })
  })

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      req.body = { productId: 'prod-1', quantity: 2 }
      const mockItem = { id: 'item-1', product_id: 'prod-1', quantity: 2 }
      Cart.findOrCreateCart.mockResolvedValue({ id: 'cart-1' })
      Cart.addItemToCart.mockResolvedValue(mockItem)

      await cartController.addToCart(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockItem)
    })
  })

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      req.params.id = 'item-1'
      req.body.quantity = 5
      const mockItem = { id: 'item-1', quantity: 5 }
      Cart.updateCartItem.mockResolvedValue(mockItem)

      await cartController.updateCartItem(req, res)

      expect(res.json).toHaveBeenCalledWith(mockItem)
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      req.params.id = 'item-1'
      Cart.removeItemFromCart.mockResolvedValue({ id: 'item-1' })

      await cartController.removeFromCart(req, res)

      expect(res.json).toHaveBeenCalled()
    })
  })
})
