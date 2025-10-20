import pool from '../config/database.js'
import { generateWhatsAppLink } from '../utils/whatsapp.js'

/**
 * Generar enlace WhatsApp para contactar salón
 */
export const getWhatsAppLinkForSalon = async (req, res) => {
  try {
    const { salonId } = req.params
    const { reservationId, context = 'general' } = req.query
    const userId = req.user?.id

    const salonResult = await pool.query(
      'SELECT id, business_name, whatsapp_number, whatsapp_enabled FROM salon_profiles WHERE id = $1',
      [salonId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    const salon = salonResult.rows[0]

    if (!salon.whatsapp_enabled) {
      return res.status(400).json({ 
        error: 'WHATSAPP_NOT_AVAILABLE',
        message: 'This salon does not have WhatsApp contact enabled'
      })
    }

    let booking = null
    let user = {}

    if (reservationId) {
      const reservationResult = await pool.query(
        `SELECT r.*, 
                to_char(r.start_time, 'DD/MM/YYYY') as scheduled_date,
                to_char(r.start_time, 'HH24:MI') as scheduled_time,
                'R' || LPAD(r.id::text, 6, '0') as short_id
         FROM reservations r
         WHERE r.id = $1`,
        [reservationId]
      )

      if (reservationResult.rows.length > 0) {
        booking = reservationResult.rows[0]
      }
    }

    if (userId) {
      const userResult = await pool.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length > 0) {
        user = userResult.rows[0]
      }
    }

    const whatsappLink = generateWhatsAppLink(salon, booking, user, context)

    if (!whatsappLink) {
      return res.status(500).json({ 
        error: 'WHATSAPP_LINK_ERROR',
        message: 'Could not generate WhatsApp link'
      })
    }

    return res.status(200).json({
      success: true,
      whatsappLink,
      salon: {
        id: salon.id,
        name: salon.business_name
      }
    })

  } catch (error) {
    console.error('Error generating WhatsApp link:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Verificar si salón tiene WhatsApp habilitado
 */
export const checkSalonWhatsApp = async (req, res) => {
  try {
    const { salonId } = req.params

    const salonResult = await pool.query(
      'SELECT id, business_name, whatsapp_enabled FROM salon_profiles WHERE id = $1',
      [salonId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    const salon = salonResult.rows[0]

    return res.status(200).json({
      success: true,
      salonId: salon.id,
      salonName: salon.business_name,
      whatsappEnabled: salon.whatsapp_enabled
    })

  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
