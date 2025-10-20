import { getSalonCapacity, getDayAvailability, checkSlotAvailability } from '../services/availabilityService.js'
import pool from '../config/database.js'

/**
 * Obtener capacidad del salón
 */
export const getSalonCapacityInfo = async (req, res) => {
  try {
    const { salonId } = req.params

    const capacity = await getSalonCapacity(salonId)

    return res.status(200).json({
      success: true,
      salonId: parseInt(salonId),
      capacityEnabled: capacity.capacityEnabled,
      maxCapacity: capacity.maxCapacity
    })

  } catch (error) {
    console.error('Error getting salon capacity:', error)
    
    if (error.message === 'Salon not found') {
      return res.status(404).json({ error: 'Salon not found' })
    }

    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Obtener disponibilidad por día
 */
export const getDayAvailabilitySlots = async (req, res) => {
  try {
    const { salonId } = req.params
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
    }

    const slots = await getDayAvailability(parseInt(salonId), date)

    return res.status(200).json({
      success: true,
      salonId: parseInt(salonId),
      date,
      slots,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length
    })

  } catch (error) {
    console.error('Error getting day availability:', error)
    
    if (error.message === 'Salon not found') {
      return res.status(404).json({ error: 'Salon not found' })
    }

    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Verificar disponibilidad de un slot específico
 */
export const checkSpecificSlot = async (req, res) => {
  const client = await pool.connect()

  try {
    const { salonId } = req.params
    const { startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime parameters are required' })
    }

    await client.query('BEGIN')

    const availability = await checkSlotAvailability(
      client,
      parseInt(salonId),
      startTime,
      endTime
    )

    await client.query('COMMIT')

    return res.status(200).json({
      success: true,
      salonId: parseInt(salonId),
      startTime,
      endTime,
      ...availability
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error checking slot availability:', error)
    
    if (error.message === 'Salon not found') {
      return res.status(404).json({ error: 'Salon not found' })
    }

    return res.status(500).json({ error: error.message || 'Internal server error' })
  } finally {
    client.release()
  }
}
