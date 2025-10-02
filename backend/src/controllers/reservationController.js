import * as Reservation from '../models/Reservation.js'
import { getAvailableSlots } from '../utils/slots.js'
import { createCalendarEvent, deleteCalendarEvent } from '../utils/googleCalendar.js'
import { sendReservationConfirmation, sendReservationCancellation } from '../utils/whatsapp.js'

export const getSlots = async (req, res) => {
  try {
    const { salonId, serviceId, date } = req.query

    if (!salonId || !serviceId || !date) {
      return res.status(400).json({ error: 'salonId, serviceId, and date are required' })
    }

    const slots = await getAvailableSlots({
      salonProfileId: salonId,
      serviceId,
      date,
    })

    res.json(slots)
  } catch (error) {
    console.error('Get slots error:', error)
    res.status(500).json({ error: 'Failed to get available slots' })
  }
}

export const createReservation = async (req, res) => {
  try {
    const userId = req.user.id
    const { salonProfileId, serviceId, startTime, endTime, totalPrice, notes, clientPhone, clientEmail } = req.body

    const reservation = await Reservation.createReservation({
      userId,
      salonProfileId,
      serviceId,
      startTime,
      endTime,
      totalPrice,
      notes,
      clientPhone,
      clientEmail,
    })

    res.status(201).json(reservation)
  } catch (error) {
    console.error('Create reservation error:', error)
    res.status(500).json({ error: 'Failed to create reservation' })
  }
}

export const getReservation = async (req, res) => {
  try {
    const { id } = req.params
    const reservation = await Reservation.findReservationById(id)

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    res.json(reservation)
  } catch (error) {
    console.error('Get reservation error:', error)
    res.status(500).json({ error: 'Failed to get reservation' })
  }
}

export const getUserReservations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id
    
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { status, startDate, endDate } = req.query
    const reservations = await Reservation.findReservationsByUserId(userId, {
      status,
      startDate,
      endDate,
    })

    res.json(reservations)
  } catch (error) {
    console.error('Get user reservations error:', error)
    res.status(500).json({ error: 'Failed to get reservations' })
  }
}

export const getSalonReservations = async (req, res) => {
  try {
    const { salonId } = req.params
    const { status, startDate, endDate } = req.query

    const reservations = await Reservation.findReservationsBySalonId(salonId, {
      status,
      startDate,
      endDate,
    })

    res.json(reservations)
  } catch (error) {
    console.error('Get salon reservations error:', error)
    res.status(500).json({ error: 'Failed to get salon reservations' })
  }
}

export const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params
    const reservation = await Reservation.findReservationById(id)

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    let googleCalendarEventId = null
    try {
      const calendarEvent = await createCalendarEvent({
        summary: `${reservation.service_name} - ${reservation.first_name} ${reservation.last_name}`,
        description: reservation.notes || '',
        startTime: new Date(reservation.start_time),
        endTime: new Date(reservation.end_time),
        attendeeEmail: reservation.email,
      })
      googleCalendarEventId = calendarEvent.id
    } catch (error) {
      console.error('Google Calendar error:', error)
    }

    const updated = await Reservation.updateReservationStatus(id, 'confirmed', {
      googleCalendarEventId,
    })

    try {
      await sendReservationConfirmation({
        ...updated,
        salon_profile: { business_name: reservation.business_name },
        service: { name: reservation.service_name },
      })
    } catch (error) {
      console.error('WhatsApp error:', error)
    }

    res.json(updated)
  } catch (error) {
    console.error('Confirm reservation error:', error)
    res.status(500).json({ error: 'Failed to confirm reservation' })
  }
}

export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const reservation = await Reservation.findReservationById(id)

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    if (reservation.google_calendar_event_id) {
      try {
        await deleteCalendarEvent(reservation.google_calendar_event_id)
      } catch (error) {
        console.error('Google Calendar delete error:', error)
      }
    }

    const cancelled = await Reservation.cancelReservation(id, reason || 'Cancelled by user')

    try {
      await sendReservationCancellation({
        ...cancelled,
        salon_profile: { business_name: reservation.business_name },
        cancellation_reason: reason,
      })
    } catch (error) {
      console.error('WhatsApp error:', error)
    }

    res.json(cancelled)
  } catch (error) {
    console.error('Cancel reservation error:', error)
    res.status(500).json({ error: 'Failed to cancel reservation' })
  }
}

export const completeReservation = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['completed', 'no_show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await Reservation.updateReservationStatus(id, status)
    res.json(updated)
  } catch (error) {
    console.error('Complete reservation error:', error)
    res.status(500).json({ error: 'Failed to update reservation' })
  }
}
