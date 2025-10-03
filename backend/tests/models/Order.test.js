import { describe, it, expect, beforeEach } from 'vitest'
import pool from '../../src/config/database.js'
import * as Order from '../../src/models/Order.js'
import * as User from '../../src/models/User.js'

describe('Order Model', () => {
  let testUser

  beforeEach(async () => {
    await pool.query('DELETE FROM order_items')
    await pool.query('DELETE FROM orders')
    await pool.query('DELETE FROM users')

    testUser = await User.createUser({
      email: 'test@example.com',
      passwordHash: 'hash',
      role: 'user',
    })
  })

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const orderData = {
        userId: testUser.id,
        items: [],
        shippingMethod: 'standard',
        shippingAddress: { street: '123 Main St', city: 'Madrid' },
        subtotal: 100,
        shippingCost: 4.99,
        tax: 21,
        total: 125.99,
      }

      const order = await Order.createOrder(orderData)

      expect(order).toBeDefined()
      expect(order.order_number).toBeDefined()
      expect(order.status).toBe('pending')
      expect(order.total).toBe('125.99')
    })
  })

  describe('findOrdersByUserId', () => {
    it('should return user orders', async () => {
      await Order.createOrder({
        userId: testUser.id,
        items: [],
        shippingMethod: 'standard',
        shippingAddress: {},
        subtotal: 100,
        shippingCost: 4.99,
        tax: 21,
        total: 125.99,
      })

      const orders = await Order.findOrdersByUserId(testUser.id)

      expect(orders.length).toBe(1)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const order = await Order.createOrder({
        userId: testUser.id,
        items: [],
        shippingMethod: 'standard',
        shippingAddress: {},
        subtotal: 100,
        shippingCost: 4.99,
        tax: 21,
        total: 125.99,
      })

      const updated = await Order.updateOrderStatus(order.id, 'paid')

      expect(updated.status).toBe('paid')
    })
  })
})
