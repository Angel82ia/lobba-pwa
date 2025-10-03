import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Order from '../../src/models/Order.js'
import * as Product from '../../src/models/Product.js'
import * as Cart from '../../src/models/Cart.js'

vi.mock('../../src/models/Order.js')
vi.mock('../../src/models/Product.js')
vi.mock('../../src/models/Cart.js')

const { mockConstructEvent } = vi.hoisted(() => {
  const mockConstructEvent = vi.fn()
  return { mockConstructEvent }
})

vi.mock('stripe', () => {
  const Stripe = vi.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }))
  return { default: Stripe }
})

import * as webhookController from '../../src/controllers/webhookController.js'

describe('Webhook Controller', () => {
  let req, res

  beforeEach(() => {
    vi.clearAllMocks()

    req = {
      body: Buffer.from('test-body'),
      headers: {
        'stripe-signature': 'test-signature',
      },
    }

    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
  })

  describe('handleStripeWebhook', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: {
              userId: 'user-1',
              cartId: 'cart-1',
              orderId: 'order-1',
            },
          },
        },
      }

      mockConstructEvent.mockReturnValue(mockEvent)
      Order.updateStripePaymentIntent.mockResolvedValue({})
      Order.updateOrderStatus.mockResolvedValue({})
      Order.findOrderById.mockResolvedValue({
        id: 'order-1',
        items: [{ product_id: 'prod-1', quantity: 2 }],
      })
      Product.findProductById.mockResolvedValue({ stock_quantity: 10 })
      Product.updateStock.mockResolvedValue({})
      Cart.clearCart.mockResolvedValue({})

      await webhookController.handleStripeWebhook(req, res)

      expect(mockConstructEvent).toHaveBeenCalledWith(
        req.body,
        'test-signature',
        process.env.STRIPE_WEBHOOK_SECRET
      )
      expect(Order.updateStripePaymentIntent).toHaveBeenCalledWith('order-1', 'pi_123', 'succeeded')
      expect(Order.updateOrderStatus).toHaveBeenCalledWith('order-1', 'paid')
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('should handle payment_intent.payment_failed event', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123',
            metadata: {
              orderId: 'order-1',
            },
          },
        },
      }

      mockConstructEvent.mockReturnValue(mockEvent)
      Order.updateStripePaymentIntent.mockResolvedValue({})
      Order.updateOrderStatus.mockResolvedValue({})

      await webhookController.handleStripeWebhook(req, res)

      expect(Order.updateStripePaymentIntent).toHaveBeenCalledWith('order-1', 'pi_123', 'failed')
      expect(Order.updateOrderStatus).toHaveBeenCalledWith('order-1', 'payment_failed')
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('should handle charge.refunded event', async () => {
      const mockEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            payment_intent: 'pi_123',
          },
        },
      }

      mockConstructEvent.mockReturnValue(mockEvent)
      Order.findOrderByPaymentIntent.mockResolvedValue({
        id: 'order-1',
        items: [{ product_id: 'prod-1', quantity: 2 }],
      })
      Order.updateOrderStatus.mockResolvedValue({})
      Product.findProductById.mockResolvedValue({ stock_quantity: 8 })
      Product.updateStock.mockResolvedValue({})

      await webhookController.handleStripeWebhook(req, res)

      expect(Order.findOrderByPaymentIntent).toHaveBeenCalledWith('pi_123')
      expect(Order.updateOrderStatus).toHaveBeenCalledWith('order-1', 'refunded')
      expect(Product.updateStock).toHaveBeenCalledWith('prod-1', 10)
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('should return 400 for invalid signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      await webhookController.handleStripeWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('Webhook Error: Invalid signature')
    })

    it('should handle unhandled event types', async () => {
      const mockEvent = {
        type: 'some.other.event',
        data: { object: {} },
      }

      mockConstructEvent.mockReturnValue(mockEvent)

      await webhookController.handleStripeWebhook(req, res)

      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('should handle processing errors', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            metadata: { orderId: 'order-1' },
          },
        },
      }

      mockConstructEvent.mockReturnValue(mockEvent)
      Order.updateStripePaymentIntent.mockRejectedValue(new Error('DB error'))

      await webhookController.handleStripeWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' })
    })
  })
})
