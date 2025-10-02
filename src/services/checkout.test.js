import { describe, it, expect, vi } from 'vitest'
import * as checkoutService from './checkout'
import apiClient from './api'

vi.mock('./api')

describe('Checkout Service', () => {
  it('should create payment intent', async () => {
    const mockResponse = { clientSecret: 'secret_123', total: 100 }
    apiClient.post.mockResolvedValue({ data: mockResponse })

    const result = await checkoutService.createPaymentIntent('standard')

    expect(result).toEqual(mockResponse)
    expect(apiClient.post).toHaveBeenCalledWith('/checkout/payment-intent', {
      shippingMethod: 'standard',
    })
  })

  it('should confirm payment', async () => {
    const mockOrder = { id: 'order-1', status: 'paid' }
    apiClient.post.mockResolvedValue({ data: mockOrder })

    const result = await checkoutService.confirmPayment('pi_123', { street: '123 Main' }, 'standard')

    expect(result).toEqual(mockOrder)
  })

  it('should calculate shipping', async () => {
    apiClient.post.mockResolvedValue({ data: { shippingCost: 4.99 } })

    const result = await checkoutService.calculateShipping('standard')

    expect(result).toEqual({ shippingCost: 4.99 })
  })
})
