import * as AvailabilityBlock from '../models/AvailabilityBlock.js'
import pool from '../config/database.js'

/**
 * Crear bloqueo de disponibilidad
 */
export const createAvailabilityBlock = async (req, res) => {
  try {
    const { salonId } = req.params
    const userId = req.user?.id
    const { startTime, endTime, blockType, title, description } = req.body

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' })
    }

    const salonResult = await pool.query(
      'SELECT user_id FROM salon_profiles WHERE id = $1',
      [salonId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' })
    }

    if (salonResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to manage this salon' })
    }

    const block = await AvailabilityBlock.createBlock({
      salonProfileId: salonId,
      startTime,
      endTime,
      blockType,
      title,
      description,
      createdBy: userId
    })

    return res.status(201).json({
      success: true,
      block
    })

  } catch (error) {
    console.error('Error creating availability block:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Obtener bloqueos de un salón
 */
export const getSalonBlocks = async (req, res) => {
  try {
    const { salonId } = req.params
    const { activeOnly = 'true' } = req.query

    const blocks = await AvailabilityBlock.getSalonBlocks(
      salonId, 
      activeOnly === 'true'
    )

    return res.status(200).json({
      success: true,
      blocks
    })

  } catch (error) {
    console.error('Error getting salon blocks:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Obtener bloqueos en un rango de tiempo
 */
export const getBlocksInRange = async (req, res) => {
  try {
    const { salonId } = req.params
    const { startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' })
    }

    const blocks = await AvailabilityBlock.getBlocksInRange(
      salonId,
      startTime,
      endTime
    )

    return res.status(200).json({
      success: true,
      blocks,
      isBlocked: blocks.length > 0
    })

  } catch (error) {
    console.error('Error getting blocks in range:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Actualizar bloqueo
 */
export const updateAvailabilityBlock = async (req, res) => {
  try {
    const { blockId } = req.params
    const userId = req.user?.id

    const blockResult = await pool.query(
      `SELECT ab.*, sp.user_id as salon_owner_id
       FROM availability_blocks ab
       JOIN salon_profiles sp ON ab.salon_profile_id = sp.id
       WHERE ab.id = $1`,
      [blockId]
    )

    if (blockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' })
    }

    if (blockResult.rows[0].salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this block' })
    }

    const updated = await AvailabilityBlock.updateBlock(blockId, req.body)

    return res.status(200).json({
      success: true,
      block: updated
    })

  } catch (error) {
    console.error('Error updating availability block:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

/**
 * Eliminar bloqueo
 */
export const deleteAvailabilityBlock = async (req, res) => {
  try {
    const { blockId } = req.params
    const userId = req.user?.id
    const { permanent = false } = req.query

    const blockResult = await pool.query(
      `SELECT ab.*, sp.user_id as salon_owner_id
       FROM availability_blocks ab
       JOIN salon_profiles sp ON ab.salon_profile_id = sp.id
       WHERE ab.id = $1`,
      [blockId]
    )

    if (blockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' })
    }

    if (blockResult.rows[0].salon_owner_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this block' })
    }

    if (permanent === 'true') {
      await AvailabilityBlock.permanentDeleteBlock(blockId)
    } else {
      await AvailabilityBlock.deleteBlock(blockId)
    }

    return res.status(200).json({
      success: true,
      message: permanent === 'true' ? 'Block permanently deleted' : 'Block deactivated'
    })

  } catch (error) {
    console.error('Error deleting availability block:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
