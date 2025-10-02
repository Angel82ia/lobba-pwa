import { google } from 'googleapis'
import { initializeGoogleAuth } from '../config/googleAuth.js'

export const createCalendarEvent = async ({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmail,
  credentials = null,
}) => {
  const auth = initializeGoogleAuth(credentials)
  const calendar = google.calendar({ version: 'v3', auth })

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  })

  return response.data
}

export const updateCalendarEvent = async (eventId, updates, credentials = null) => {
  const auth = initializeGoogleAuth(credentials)
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    resource: updates,
  })

  return response.data
}

export const deleteCalendarEvent = async (eventId, credentials = null) => {
  const auth = initializeGoogleAuth(credentials)
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  })
}
