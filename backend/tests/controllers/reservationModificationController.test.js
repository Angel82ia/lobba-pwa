import { describe, it, expect, beforeEach, vi } from 'vitest'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn()
  }
}))

vi.mock('../../src/models/SalonService.js', () => ({
  findServiceById: vi.fn()
}))

vi.mock('../../src/models/AvailabilityBlock.js', () => ({
  isSlotBlocked: vi.fn()
}))

const { modifyReservation, getReservationHistory } = await import('../../src/controllers/reservationModificationController.js')
const SalonService = await import('../../src/models/SalonService.js')
const AvailabilityBlock = await import('../../src/models/AvailabilityBlock.js')

describe('ReservationModificationController', () => {
  let mockClient
  let mockReq
  let mockRes

  beforeEach(() => {
    vi.clearAllMocks()

    mockClient = {
      query: vi.fn(),
      release: vi.fn()
    }

    pool.connect.mockResolvedValue(mockClient)

    mockReq = {
      params: { reservationId: 'res-1' },
      user: { id: 'user-1' },
      body: {}
    }

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('modifyReservation', () => {
    it('should modify reservation time successfully', async () => {
      const mockReservation = {
        id: 'res-1',
        user_id: 'user-1',
        service_id: 'service-1',
        salon_profile_id: 'salon-1',
        start_time: new Date('2025-10-20T10:00:00Z'),
        end_time: new Date('2025-10-20T11:00:00Z'),
        status: 'pending',
        total_price: 50
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockReservation] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ ...mockReservation, start_time: '2025-10-20T14:00:00Z' }] })
        .mockResolvedValueOnce({})

      AvailabilityBlock.isSlotBlocked.mockResolvedValue(false)

      mockReq.body = {
        startTime: '2025-10-20T14:00:00Z'
      }

      await modifyReservation(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Reservation modified successfully'
        })
      )
    })

    it('should prevent modification if slot is blocked', async () => {
      const mockReservation = {
        id: 'res-1',
        user_id: 'user-1',
        service_id: 'service-1',
        salon_profile_id: 'salon-1',
        status: 'pending'
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockReservation] })
        .mockResolvedValueOnce({})

      AvailabilityBlock.isSlotBlocked.mockResolvedValue(true)

      mockReq.body = {
        startTime: '2025-10-20T14:00:00Z',
        endTime: '2025-10-20T15:00:00Z'
      }

      await modifyReservation(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'New time slot is blocked by the salon'
      })
    })

    it('should prevent modification if slot is already booked', async () => {
      const mockReservation = {
        id: 'res-1',
        user_id: 'user-1',
        service_id: 'service-1',
        salon_profile_id: 'salon-1',
        status: 'pending'
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockReservation] })
        .mockResolvedValueOnce({ rows: [{ id: 'other-res' }] })
        .mockResolvedValueOnce({})

      AvailabilityBlock.isSlotBlocked.mockResolvedValue(false)

      mockReq.body = {
        startTime: '2025-10-20T14:00:00Z',
        endTime: '2025-10-20T15:00:00Z'
      }

      await modifyReservation(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'New time slot is already booked'
      })
    })

    it('should prevent modification of cancelled reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        user_id: 'user-1',
        status: 'cancelled'
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockReservation] })
        .mockResolvedValueOnce({})

      mockReq.body = { notes: 'New notes' }

      await modifyReservation(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Cannot modify cancelled reservation'
      })
    })

    it('should change service and recalculate prices', async () => {
      const mockReservation = {
        id: 'res-1',
        user_id: 'user-1',
        service_id: 'service-1',
        salon_profile_id: 'salon-1',
        status: 'pending',
        total_price: 50,
        commission_percentage: 3,
        current_service_name: 'Haircut'
      }

      const newService = {
        id: 'service-2',
        salon_profile_id: 'salon-1',
        name: 'Hair Dye',
        price: 80
      }

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockReservation] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ ...mockReservation, service_id: 'service-2', total_price: 80 }] })
        .mockResolvedValueOnce({})

      SalonService.findServiceById.mockResolvedValue(newService)

      mockReq.body = {
        serviceId: 'service-2'
      }

      await modifyReservation(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          changes: expect.objectContaining({
            service: expect.any(Object)
          })
        })
      )
    })
  })

  describe('getReservationHistory', () => {
    it('should return reservation history', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          action: 'modified',
          changes: { start_time: { from: '10:00', to: '14:00' } },
          created_at: new Date()
        }
      ]

      pool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] })
        .mockResolvedValueOnce({ rows: mockHistory })

      await getReservationHistory(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        history: mockHistory
      })
    })

    it('should return 404 if reservation not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] })

      await getReservationHistory(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Reservation not found'
      })
    })
  })
})
