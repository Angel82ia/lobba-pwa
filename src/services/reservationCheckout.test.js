import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as reservationCheckoutService from './reservationCheckout'
import apiClient from './api'

vi.mock('./api')

describe('ReservationCheckout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate reservation checkout', async () => {
    const mockResponse = {
      success: true,
      service: {
        id: 'service-1',
        name: 'Test Service',
        price: 50,
        durationMinutes: 30,
      },
      breakdown: {
        totalPrice: 50,
        commissionPercentage: 3.0,
        commissionAmount: 1.5,
        amountToLobba: 1.5,
        amountToCommerce: 48.5,
      },
    }

    apiClient.post.mockResolvedValue({ data: mockResponse })

    const result = await reservationCheckoutService.calculateReservationCheckout(
      'service-1',
      '2024-12-25T10:00:00Z',
      '2024-12-25T10:30:00Z'
    )

    expect(result).toEqual(mockResponse)
    expect(apiClient.post).toHaveBeenCalledWith('/reservation-checkout/calculate', {
      serviceId: 'service-1',
      startTime: '2024-12-25T10:00:00Z',
      endTime: '2024-12-25T10:30:00Z',
    })
  })

  it('should process reservation checkout', async () => {
    const mockData = {
      serviceId: 'service-1',
      startTime: '2024-12-25T10:00:00Z',
      endTime: '2024-12-25T10:30:00Z',
      notes: 'Test notes',
      clientPhone: '+34123456789',
    }

    const mockResponse = {
      success: true,
      paymentIntent: {
        id: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_456',
      },
    }

    apiClient.post.mockResolvedValue({ data: mockResponse })

    const result = await reservationCheckoutService.processReservationCheckout(mockData)

    expect(result).toEqual(mockResponse)
    expect(apiClient.post).toHaveBeenCalledWith('/reservation-checkout/process', mockData)
  })

  it('should confirm reservation payment', async () => {
    const mockResponse = {
      success: true,
      reservation: {
        id: 'reservation-123',
        status: 'confirmed',
      },
    }

    apiClient.post.mockResolvedValue({ data: mockResponse })

    const result = await reservationCheckoutService.confirmReservationPayment('pi_test_123')

    expect(result).toEqual(mockResponse)
    expect(apiClient.post).toHaveBeenCalledWith('/reservation-checkout/confirm', {
      paymentIntentId: 'pi_test_123',
    })
  })

  it('should cancel reservation with refund', async () => {
    const mockResponse = {
      success: true,
      refund: {
        id: 'refund_123',
        amount: 5000, // 50.00€ in cents
        status: 'succeeded',
      },
    }

    apiClient.delete.mockResolvedValue({ data: mockResponse })

    const result = await reservationCheckoutService.cancelReservationWithRefund(
      'reservation-123',
      'Customer requested cancellation'
    )

    expect(result).toEqual(mockResponse)
    expect(apiClient.delete).toHaveBeenCalledWith('/reservation-checkout/reservation-123/cancel', {
      data: { reason: 'Customer requested cancellation' },
    })
  })

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error')
    apiClient.post.mockRejectedValue(error)

    await expect(
      reservationCheckoutService.calculateReservationCheckout('service-1', 'start', 'end')
    ).rejects.toThrow('Network error')
  })
})
