import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Cart from '../../src/models/Cart.js'
import * as checkoutController from '../../src/controllers/checkoutController.js'
import * as stripe from '../../src/utils/stripe.js'

vi.mock('../../src/models/Cart.js')
vi.mock('../../src/models/Order.js')
vi.mock('../../src/models/Product.js')
vi.mock('../../src/utils/stripe.js')

describe('Checkout Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user-123' },
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
  })

  describe('createPaymentIntent', () => {
    it('should create payment intent', async () => {
      req.body.shippingMethod = 'standard'
      const mockCart = { 
        id: 'cart-1', 
        items: [{ 
          base_price: '50.00', 
          discount_percentage: '0', 
          price_adjustment: '0',
          quantity: 2 
        }] 
      }
      Cart.findOrCreateCart.mockResolvedValue({ id: 'cart-1' })
      Cart.getCartWithItems.mockResolvedValue(mockCart)
      stripe.createPaymentIntent.mockResolvedValue({ client_secret: 'secret_123' })

      await checkoutController.createPaymentIntentController(req, res)

      expect(res.json).toHaveBeenCalled()
      expect(stripe.createPaymentIntent).toHaveBeenCalled()
    })

    it('should return 400 if cart is empty', async () => {
      Cart.findOrCreateCart.mockResolvedValue({ id: 'cart-1' })
      Cart.getCartWithItems.mockResolvedValue({ id: 'cart-1', items: [] })

      await checkoutController.createPaymentIntentController(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('calculateShipping', () => {
    it('should return shipping cost for standard', async () => {
      req.body.shippingMethod = 'standard'

      await checkoutController.calculateShipping(req, res)

      expect(res.json).toHaveBeenCalledWith({ shippingCost: 4.99 })
    })

    it('should return shipping cost for express', async () => {
      req.body.shippingMethod = 'express'

      await checkoutController.calculateShipping(req, res)

      expect(res.json).toHaveBeenCalledWith({ shippingCost: 9.99 })
    })

    it('should return 0 for click_collect', async () => {
      req.body.shippingMethod = 'click_collect'

      await checkoutController.calculateShipping(req, res)

      expect(res.json).toHaveBeenCalledWith({ shippingCost: 0 })
    })
  })
})
