import { getSalonSettings, updateSalonSettings } from '../models/SalonSettings.js'
import pool from '../config/database.js'

/**
 * Obtener configuración de un salón
 */
export const getSettings = async (req, res) => {
  try {
    const { salonId } = req.params

    const settings = await getSalonSettings(salonId)

    return res.status(200).json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Error getting salon settings:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Actualizar configuración de un salón
 */
export const updateSettings = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id

    const salonResult = await pool.query(
      'SELECT user_id FROM salon_profiles WHERE id = $1',
      [salonId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this salon settings' })
    }

    const settings = await updateSalonSettings(salonId, req.body)

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    })

  } catch (error) {
    console.error('Error updating salon settings:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
