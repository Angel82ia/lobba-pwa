import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Order from '../../src/models/Order.js'
import * as orderController from '../../src/controllers/orderController.js'

vi.mock('../../src/models/Order.js')

describe('Order Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user-123', role: 'user' },
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    }
  })

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      const mockOrders = [{ id: 'order-1', user_id: 'user-123' }]
      Order.findOrdersByUserId.mockResolvedValue(mockOrders)

      await orderController.getUserOrders(req, res)

      expect(res.json).toHaveBeenCalledWith(mockOrders)
    })
  })

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      req.params.id = 'order-1'
      const mockOrder = { id: 'order-1', user_id: 'user-123' }
      Order.findOrderById.mockResolvedValue(mockOrder)

      await orderController.getOrderById(req, res)

      expect(res.json).toHaveBeenCalledWith(mockOrder)
    })

    it('should return 404 if order not found', async () => {
      req.params.id = 'order-1'
      Order.findOrderById.mockResolvedValue(null)

      await orderController.getOrderById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 403 if not owner or admin', async () => {
      req.params.id = 'order-1'
      const mockOrder = { id: 'order-1', user_id: 'other-user' }
      Order.findOrderById.mockResolvedValue(mockOrder)

      await orderController.getOrderById(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status as admin', async () => {
      req.user.role = 'admin'
      req.params.id = 'order-1'
      req.body.status = 'shipped'
      const mockOrder = { id: 'order-1', status: 'shipped' }
      Order.updateOrderStatus.mockResolvedValue(mockOrder)

      await orderController.updateOrderStatus(req, res)

      expect(res.json).toHaveBeenCalledWith(mockOrder)
    })

    it('should reject if not admin or salon', async () => {
      req.user.role = 'user'

      await orderController.updateOrderStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
