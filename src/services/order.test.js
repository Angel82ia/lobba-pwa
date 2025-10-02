import { describe, it, expect, vi } from 'vitest'
import * as orderService from './order'
import apiClient from './api'

vi.mock('./api')

describe('Order Service', () => {
  it('should fetch user orders', async () => {
    const mockOrders = [{ id: 'order-1' }]
    apiClient.get.mockResolvedValue({ data: mockOrders })

    const result = await orderService.getUserOrders()

    expect(result).toEqual(mockOrders)
  })

  it('should fetch order by id', async () => {
    const mockOrder = { id: 'order-1', total: '100.00' }
    apiClient.get.mockResolvedValue({ data: mockOrder })

    const result = await orderService.getOrderById('order-1')

    expect(result).toEqual(mockOrder)
  })

  it('should update order status', async () => {
    const mockOrder = { id: 'order-1', status: 'shipped' }
    apiClient.put.mockResolvedValue({ data: mockOrder })

    const result = await orderService.updateOrderStatus('order-1', 'shipped')

    expect(result).toEqual(mockOrder)
  })
})
