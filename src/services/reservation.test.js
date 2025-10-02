import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as reservationService from './reservation'
import apiClient from './api'

vi.mock('./api')

describe('Reservation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableSlots', () => {
    it('should fetch available slots', async () => {
      const mockSlots = ['09:00', '09:15', '09:30']
      apiClient.get.mockResolvedValue({ data: mockSlots })

      const slots = await reservationService.getAvailableSlots('salon-123', 'service-123', '2025-10-13')

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/slots', {
        params: { salonId: 'salon-123', serviceId: 'service-123', date: '2025-10-13' },
      })
      expect(slots).toEqual(mockSlots)
    })
  })

  describe('createReservation', () => {
    it('should create a reservation', async () => {
      const mockReservation = { id: '123', status: 'pending' }
      apiClient.post.mockResolvedValue({ data: mockReservation })

      const reservation = await reservationService.createReservation({
        salonProfileId: 'salon-123',
        serviceId: 'service-123',
        startTime: '2025-10-13T10:00:00Z',
        endTime: '2025-10-13T11:00:00Z',
        totalPrice: 50.00,
      })

      expect(apiClient.post).toHaveBeenCalled()
      expect(reservation).toEqual(mockReservation)
    })
  })

  describe('getUserReservations', () => {
    it('should fetch user reservations', async () => {
      const mockReservations = [{ id: '123' }, { id: '456' }]
      apiClient.get.mockResolvedValue({ data: mockReservations })

      const reservations = await reservationService.getUserReservations()

      expect(apiClient.get).toHaveBeenCalledWith('/reservations/user/')
      expect(reservations).toEqual(mockReservations)
    })
  })

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      const mockCancelled = { id: '123', status: 'cancelled' }
      apiClient.put.mockResolvedValue({ data: mockCancelled })

      const result = await reservationService.cancelReservation('123', 'Test reason')

      expect(apiClient.put).toHaveBeenCalledWith('/reservations/123/cancel', { reason: 'Test reason' })
      expect(result).toEqual(mockCancelled)
    })
  })
})
