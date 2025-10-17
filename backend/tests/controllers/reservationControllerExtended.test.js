import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '../../src/index.js'
import * as Reservation from '../../src/models/Reservation.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'salon' }
    next()
  },
}))

vi.mock('../../src/middleware/audit.js', () => ({
  auditUserAction: (req, res, next) => next(),
}))

vi.mock('../../src/models/Reservation.js')
vi.mock('../../src/config/database.js', () => ({
  default: {
    query: vi.fn(),
  },
}))

vi.mock('../../src/utils/emailService.js', () => ({
  sendReservationConfirmationEmail: vi.fn(() => Promise.resolve()),
  sendReservationCancellationEmail: vi.fn(() => Promise.resolve()),
  sendNewReservationToSalonEmail: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../src/utils/whatsapp.js', () => ({
  sendReservationConfirmation: vi.fn(() => Promise.resolve()),
  sendReservationCancellation: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../src/utils/googleCalendar.js', () => ({
  createCalendarEvent: vi.fn(() => Promise.resolve({ id: 'calendar-event-id' })),
  deleteCalendarEvent: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Reservation Controller - Extended Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/reservations - with salon email notification', () => {
    it('should send email to salon when creating reservation', async () => {
      const mockReservation = {
        id: 'reservation-id',
        user_id: 'test-user-id',
        salon_profile_id: 'salon-id',
        service_id: 'service-id',
        start_time: new Date(),
        end_time: new Date(),
        total_price: 50,
        status: 'pending',
      }

      const mockFullReservation = {
        ...mockReservation,
        first_name: 'John',
        last_name: 'Doe',
        service_name: 'Haircut',
        business_name: 'Beauty Salon',
      }

      Reservation.createReservation.mockResolvedValue(mockReservation)
      Reservation.findReservationById.mockResolvedValue(mockFullReservation)
      pool.query.mockResolvedValue({ rows: [{ email: 'salon@example.com' }] })

      const response = await request(app)
        .post('/api/reservations')
        .send({
          salonProfileId: 'salon-id',
          serviceId: 'service-id',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          totalPrice: 50,
        })

      expect(response.status).toBe(201)
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT email FROM salon_profiles WHERE id = $1',
        ['salon-id']
      )
    })
  })

  describe('PUT /api/reservations/:id/reject', () => {
    it('should reject a reservation and send notifications', async () => {
      const mockReservation = {
        id: 'reservation-id',
        user_id: 'test-user-id',
        email: 'client@example.com',
        business_name: 'Beauty Salon',
        status: 'pending',
      }

      const mockRejected = {
        ...mockReservation,
        status: 'cancelled',
        cancellation_reason: 'Rechazada por el salón',
      }

      Reservation.findReservationById.mockResolvedValue(mockReservation)
      Reservation.cancelReservation.mockResolvedValue(mockRejected)

      const response = await request(app)
        .put('/api/reservations/reservation-id/reject')
        .send({ reason: 'No disponible' })

      expect(response.status).toBe(200)
      expect(Reservation.cancelReservation).toHaveBeenCalledWith('reservation-id', 'No disponible')
    })

    it('should return 404 when reservation not found', async () => {
      Reservation.findReservationById.mockResolvedValue(null)

      const response = await request(app)
        .put('/api/reservations/nonexistent-id/reject')
        .send({ reason: 'Test reason' })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error', 'Reservation not found')
    })
  })

  describe('PUT /api/reservations/:id/confirm - with email', () => {
    it('should send confirmation email when confirming reservation', async () => {
      const mockReservation = {
        id: 'reservation-id',
        email: 'client@example.com',
        first_name: 'John',
        service_name: 'Haircut',
        business_name: 'Beauty Salon',
        start_time: new Date(),
        end_time: new Date(),
      }

      const mockUpdated = {
        ...mockReservation,
        status: 'confirmed',
        google_calendar_event_id: 'calendar-event-id',
      }

      Reservation.findReservationById.mockResolvedValue(mockReservation)
      Reservation.updateReservationStatus.mockResolvedValue(mockUpdated)

      const response = await request(app).put('/api/reservations/reservation-id/confirm')

      expect(response.status).toBe(200)
      expect(Reservation.updateReservationStatus).toHaveBeenCalledWith(
        'reservation-id',
        'confirmed',
        { googleCalendarEventId: 'calendar-event-id' }
      )
    })
  })

  describe('PUT /api/reservations/:id/cancel - with email', () => {
    it('should send cancellation email when cancelling reservation', async () => {
      const mockReservation = {
        id: 'reservation-id',
        user_id: 'test-user-id',
        email: 'client@example.com',
        business_name: 'Beauty Salon',
        google_calendar_event_id: 'calendar-event-id',
      }

      const mockCancelled = {
        ...mockReservation,
        status: 'cancelled',
        cancellation_reason: 'User request',
      }

      Reservation.findReservationById.mockResolvedValue(mockReservation)
      Reservation.cancelReservation.mockResolvedValue(mockCancelled)

      const response = await request(app)
        .put('/api/reservations/reservation-id/cancel')
        .send({ reason: 'User request' })

      expect(response.status).toBe(200)
      expect(Reservation.cancelReservation).toHaveBeenCalledWith('reservation-id', 'User request')
    })
  })
})
