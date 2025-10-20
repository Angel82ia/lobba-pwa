import { checkReservationTimeout } from '../services/reservationTimeoutService.js'

/**
 * Verificar timeout de una reserva
 */
export const getReservationTimeoutStatus = async (req, res) => {
  try {
    const { reservationId } = req.params

    const timeoutStatus = await checkReservationTimeout(reservationId)

    return res.status(200).json({
      success: true,
      reservationId: parseInt(reservationId),
      ...timeoutStatus,
      warning: timeoutStatus.minutesRemaining < 30 ? 'Less than 30 minutes remaining' : null
    })

  } catch (error) {
    console.error('Error checking reservation timeout:', error)
    
    if (error.message === 'Reservation not found') {
      return res.status(404).json({ error: 'Reservation not found' })
    }

    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
