import pool from '../config/database.js'

const generateTimeSlots = (openTime, closeTime, intervalMinutes = 15) => {
  const slots = []
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)

  let currentHour = openHour
  let currentMinute = openMinute

  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    slots.push(timeString)

    currentMinute += intervalMinutes
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60)
      currentMinute = currentMinute % 60
    }
  }

  return slots
}

const addMinutesToTime = (timeString, minutes) => {
  const [hour, minute] = timeString.split(':').map(Number)
  let newMinute = minute + minutes
  let newHour = hour + Math.floor(newMinute / 60)
  newMinute = newMinute % 60
  return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
}

const timeToMinutes = timeString => {
  const [hour, minute] = timeString.split(':').map(Number)
  return hour * 60 + minute
}

const isSlotBlocked = (slotTime, slotEndTime, reservations, bufferMinutes) => {
  const slotStartMinutes = timeToMinutes(slotTime)
  const slotEndMinutes = timeToMinutes(slotEndTime)

  for (const reservation of reservations) {
    const resStart = new Date(reservation.start_time)
    const resEnd = new Date(reservation.end_time)
    const buffer = reservation.buffer_minutes || bufferMinutes

    // Use getHours() instead of getUTCHours() to work in local time
    const resStartMinutes = resStart.getHours() * 60 + resStart.getMinutes() - buffer
    const resEndMinutes = resEnd.getHours() * 60 + resEnd.getMinutes() + buffer

    if (
      (slotStartMinutes >= resStartMinutes && slotStartMinutes < resEndMinutes) ||
      (slotEndMinutes > resStartMinutes && slotEndMinutes <= resEndMinutes) ||
      (slotStartMinutes <= resStartMinutes && slotEndMinutes >= resEndMinutes)
    ) {
      return true
    }
  }

  return false
}

export const getAvailableSlots = async ({ salonProfileId, serviceId, date }) => {
  const salonResult = await pool.query('SELECT business_hours FROM salon_profiles WHERE id = $1', [
    salonProfileId,
  ])

  if (salonResult.rows.length === 0) {
    throw new Error('Salon not found')
  }

  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const businessHours = salonResult.rows[0].business_hours?.[dayName]

  if (!businessHours || !businessHours.open || !businessHours.close) {
    return []
  }

  const serviceResult = await pool.query(
    'SELECT duration_minutes FROM salon_services WHERE id = $1',
    [serviceId]
  )

  if (serviceResult.rows.length === 0) {
    throw new Error('Service not found')
  }

  const serviceDuration = serviceResult.rows[0].duration_minutes

  const reservationsResult = await pool.query(
    `SELECT start_time, end_time, buffer_minutes
     FROM reservations
     WHERE salon_profile_id = $1
       AND DATE(start_time AT TIME ZONE 'UTC') = $2
       AND status IN ('confirmed', 'pending')`,
    [salonProfileId, date]
  )

  // Obtener también los bloqueos de disponibilidad (ej: desde Google Calendar)
  const blocksResult = await pool.query(
    `SELECT start_time, end_time, 0 as buffer_minutes
     FROM availability_blocks
     WHERE salon_profile_id = $1
       AND DATE(start_time AT TIME ZONE 'UTC') = $2
       AND is_active = true`,
    [salonProfileId, date]
  )

  // Combinar reservas y bloqueos
  const existingReservations = [...reservationsResult.rows, ...blocksResult.rows]

  const allSlots = generateTimeSlots(businessHours.open, businessHours.close, 15)

  const availableSlots = allSlots.filter(slot => {
    const slotEnd = addMinutesToTime(slot, serviceDuration)
    const slotEndMinutes = timeToMinutes(slotEnd)
    const closeMinutes = timeToMinutes(businessHours.close)

    if (slotEndMinutes > closeMinutes) {
      return false
    }

    return !isSlotBlocked(slot, slotEnd, existingReservations, 15)
  })

  return availableSlots
}
