import pool from '../config/database.js'

/**
 * Verificar disponibilidad de slot considerando capacidad simultánea
 * @param {Object} client - Cliente de base de datos
 * @param {Number} salonProfileId - ID del salón
 * @param {String} startTime - Hora inicio
 * @param {String} endTime - Hora fin
 * @returns {Object} { available: boolean, currentCount: number, maxCapacity: number }
 */
export const checkSlotAvailability = async (client, salonProfileId, startTime, endTime) => {
  const salonResult = await client.query(
    'SELECT simultaneous_capacity, capacity_enabled FROM salon_profiles WHERE id = $1',
    [salonProfileId]
  )

  if (salonResult.rows.length === 0) {
    throw new Error('Salon not found')
  }

  const salon = salonResult.rows[0]
  const maxCapacity = salon.capacity_enabled ? (salon.simultaneous_capacity || 1) : 1

  const overlappingReservations = await client.query(
    `SELECT COUNT(*) as count
     FROM reservations
     WHERE salon_profile_id = $1
       AND status NOT IN ('cancelled', 'no_show')
       AND (
         (start_time <= $2 AND end_time > $2)
         OR (start_time < $3 AND end_time >= $3)
         OR (start_time >= $2 AND end_time <= $3)
       )`,
    [salonProfileId, startTime, endTime]
  )

  const currentCount = parseInt(overlappingReservations.rows[0].count)
  const available = currentCount < maxCapacity

  return {
    available,
    currentCount,
    maxCapacity,
    slotsRemaining: maxCapacity - currentCount
  }
}

/**
 * Verificar si el salón tiene capacidad habilitada
 * @param {Number} salonProfileId - ID del salón
 * @returns {Object} { capacityEnabled: boolean, maxCapacity: number }
 */
export const getSalonCapacity = async (salonProfileId) => {
  const result = await pool.query(
    'SELECT simultaneous_capacity, capacity_enabled FROM salon_profiles WHERE id = $1',
    [salonProfileId]
  )

  if (result.rows.length === 0) {
    throw new Error('Salon not found')
  }

  const salon = result.rows[0]

  return {
    capacityEnabled: salon.capacity_enabled || false,
    maxCapacity: salon.capacity_enabled ? (salon.simultaneous_capacity || 1) : 1
  }
}

/**
 * Obtener disponibilidad por día para un salón
 * @param {Number} salonProfileId - ID del salón
 * @param {String} date - Fecha (YYYY-MM-DD)
 * @returns {Array} Array de slots con disponibilidad
 */
export const getDayAvailability = async (salonProfileId, date) => {
  const capacity = await getSalonCapacity(salonProfileId)

  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`

  const reservations = await pool.query(
    `SELECT start_time, end_time
     FROM reservations
     WHERE salon_profile_id = $1
       AND status NOT IN ('cancelled', 'no_show')
       AND start_time >= $2
       AND end_time <= $3
     ORDER BY start_time`,
    [salonProfileId, startOfDay, endOfDay]
  )

  const slots = []
  const interval = 30

  for (let hour = 9; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00Z`)
      const slotEnd = new Date(slotStart.getTime() + interval * 60000)

      let overlapping = 0

      for (const reservation of reservations.rows) {
        const resStart = new Date(reservation.start_time)
        const resEnd = new Date(reservation.end_time)

        if (
          (resStart <= slotStart && resEnd > slotStart) ||
          (resStart < slotEnd && resEnd >= slotEnd) ||
          (resStart >= slotStart && resEnd <= slotEnd)
        ) {
          overlapping++
        }
      }

      const available = overlapping < capacity.maxCapacity

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available,
        currentBookings: overlapping,
        maxCapacity: capacity.maxCapacity,
        slotsRemaining: capacity.maxCapacity - overlapping
      })
    }
  }

  return slots
}
