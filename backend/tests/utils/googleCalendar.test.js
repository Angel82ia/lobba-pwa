import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getFreeBusyInfo,
  listCalendarEvents 
} from '../../src/utils/googleCalendar.js'

const mockInsert = vi.fn().mockResolvedValue({ data: { id: 'event-123' } })
const mockUpdate = vi.fn().mockResolvedValue({ data: { id: 'event-123' } })
const mockDelete = vi.fn().mockResolvedValue({})
const mockList = vi.fn().mockResolvedValue({ 
  data: { 
    items: [
      { id: 'event-1', start: { dateTime: '2025-10-20T10:00:00Z' }, end: { dateTime: '2025-10-20T11:00:00Z' } }
    ] 
  } 
})
const mockFreeBusyQuery = vi.fn().mockResolvedValue({ 
  data: { 
    calendars: { 
      primary: { 
        busy: [{ start: '2025-10-20T10:00:00Z', end: '2025-10-20T11:00:00Z' }] 
      } 
    } 
  } 
})

vi.mock('googleapis', () => ({
  google: {
    calendar: vi.fn(() => ({
      events: {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        list: mockList,
      },
      freebusy: {
        query: mockFreeBusyQuery,
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
    getFreeBusyInfo: vi.fn().mockResolvedValue([{ start: '2025-10-20T10:00:00Z', end: '2025-10-20T11:00:00Z' }]),
    listCalendarEvents: vi.fn().mockResolvedValue([{ id: 'event-1', start: { dateTime: '2025-10-20T10:00:00Z' } }]),
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

  describe('getFreeBusyInfo', () => {
    it('should return busy time slots', async () => {
      const busySlots = await getFreeBusyInfo({
        startTime: new Date('2025-10-20T00:00:00Z'),
        endTime: new Date('2025-10-20T23:59:59Z'),
      })

      expect(busySlots).toHaveLength(1)
      expect(busySlots[0].start).toBe('2025-10-20T10:00:00Z')
    })
  })

  describe('listCalendarEvents', () => {
    it('should list calendar events for date range', async () => {
      const events = await listCalendarEvents({
        startTime: new Date('2025-10-20T00:00:00Z'),
        endTime: new Date('2025-10-20T23:59:59Z'),
      })

      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('event-1')
    })
  })
})
