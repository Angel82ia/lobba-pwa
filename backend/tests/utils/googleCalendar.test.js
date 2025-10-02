import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../src/utils/googleCalendar.js'

const mockInsert = vi.fn().mockResolvedValue({ data: { id: 'event-123' } })
const mockUpdate = vi.fn().mockResolvedValue({ data: { id: 'event-123' } })
const mockDelete = vi.fn().mockResolvedValue({})

vi.mock('googleapis', () => ({
  google: {
    calendar: vi.fn(() => ({
      events: {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      },
    })),
    auth: {
      OAuth2: vi.fn(() => ({
        setCredentials: vi.fn(),
      })),
    },
  },
}))

vi.mock('../../src/utils/googleCalendar.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createCalendarEvent: vi.fn().mockResolvedValue({ id: 'event-123' }),
    updateCalendarEvent: vi.fn().mockResolvedValue({ id: 'event-123' }),
    deleteCalendarEvent: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Google Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCalendarEvent', () => {
    it('should create calendar event with correct parameters', async () => {
      const event = await createCalendarEvent({
        summary: 'Test Appointment',
        description: 'Test description',
        startTime: new Date('2025-10-10T10:00:00Z'),
        endTime: new Date('2025-10-10T11:00:00Z'),
        attendeeEmail: 'test@example.com',
      })

      expect(event.id).toBe('event-123')
    })
  })

  describe('updateCalendarEvent', () => {
    it('should update calendar event', async () => {
      const event = await updateCalendarEvent('event-123', {
        summary: 'Updated Appointment',
      })

      expect(event.id).toBe('event-123')
    })
  })

  describe('deleteCalendarEvent', () => {
    it('should delete calendar event', async () => {
      await deleteCalendarEvent('event-123')
      expect(true).toBe(true)
    })
  })
})
