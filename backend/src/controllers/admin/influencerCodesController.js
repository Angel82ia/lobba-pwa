import pool from '../../config/database.js'
import logger from '../../utils/logger.js'

export const getAllCodes = async (req, res) => {
  try {
    const { status, search } = req.query
    
    let query = `
      SELECT 
        cd.*,
        u.first_name || ' ' || u.last_name as influencer_name,
        u.email as influencer_email,
        COUNT(DISTINCT ucd.id) as total_uses,
        COALESCE(SUM(ci.importe_comision), 0) as total_commissions
      FROM codigos_descuento cd
      LEFT JOIN users u ON cd.influencer_id = u.id
      LEFT JOIN uso_codigos_descuento ucd ON cd.id = ucd.codigo_descuento_id
      LEFT JOIN comisiones_influencers ci ON cd.influencer_id = ci.influencer_id AND ci.tipo = 'compra'
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 1
    
    if (status) {
      query += ` AND cd.activo = $${paramCount}`
      params.push(status === 'active')
      paramCount++
    }
    
    if (search) {
      query += ` AND (cd.codigo ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`
      params.push(`%${search}%`)
      paramCount++
    }
    
    query += `
      GROUP BY cd.id, u.first_name, u.last_name, u.email
      ORDER BY cd.created_at DESC
    `
    
    const result = await pool.query(query, params)
    
    res.json({
      success: true,
      codes: result.rows
    })
  } catch (error) {
    logger.error('Error fetching influencer codes:', error)
    res.status(500).json({ error: 'Error al obtener códigos de influencer' })
  }
}

export const createCode = async (req, res) => {
  try {
    const {
      influencer_id,
      codigo,
      descripcion,
      porcentaje_descuento,
      porcentaje_comision,
      fecha_inicio,
      fecha_fin,
      max_usos
    } = req.body
    
    if (!influencer_id || !codigo) {
      return res.status(400).json({ error: 'Se requiere influencer_id y codigo' })
    }
    
    const existingCode = await pool.query(
      'SELECT id FROM codigos_descuento WHERE codigo = $1',
      [codigo.toUpperCase()]
    )
    
    if (existingCode.rows.length > 0) {
      return res.status(400).json({ error: 'Este código ya existe' })
    }
    
    const result = await pool.query(
      `INSERT INTO codigos_descuento (
        influencer_id,
        codigo,
        descripcion,
        porcentaje_descuento,
        porcentaje_comision,
        fecha_inicio,
        fecha_fin,
        max_usos,
        activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *`,
      [
        influencer_id,
        codigo.toUpperCase(),
        descripcion || null,
        porcentaje_descuento || 10,
        porcentaje_comision || 10,
        fecha_inicio || new Date(),
        fecha_fin || null,
        max_usos || null
      ]
    )
    
    logger.info(`Código de influencer creado: ${codigo} para influencer ${influencer_id}`)
    
    res.status(201).json({
      success: true,
      code: result.rows[0]
    })
  } catch (error) {
    logger.error('Error creating influencer code:', error)
    res.status(500).json({ error: 'Error al crear código de influencer' })
  }
}

export const updateCode = async (req, res) => {
  try {
    const { id } = req.params
    const {
      descripcion,
      porcentaje_descuento,
      porcentaje_comision,
      fecha_inicio,
      fecha_fin,
      max_usos,
      activo
    } = req.body
    
    const fields = []
    const values = []
    let paramCount = 1
    
    if (descripcion !== undefined) {
      fields.push(`descripcion = $${paramCount}`)
      values.push(descripcion)
      paramCount++
    }
    
    if (porcentaje_descuento !== undefined) {
      fields.push(`porcentaje_descuento = $${paramCount}`)
      values.push(porcentaje_descuento)
      paramCount++
    }
    
    if (porcentaje_comision !== undefined) {
      fields.push(`porcentaje_comision = $${paramCount}`)
      values.push(porcentaje_comision)
      paramCount++
    }
    
    if (fecha_inicio !== undefined) {
      fields.push(`fecha_inicio = $${paramCount}`)
      values.push(fecha_inicio)
      paramCount++
    }
    
    if (fecha_fin !== undefined) {
      fields.push(`fecha_fin = $${paramCount}`)
      values.push(fecha_fin)
      paramCount++
    }
    
    if (max_usos !== undefined) {
      fields.push(`max_usos = $${paramCount}`)
      values.push(max_usos)
      paramCount++
    }
    
    if (activo !== undefined) {
      fields.push(`activo = $${paramCount}`)
      values.push(activo)
      paramCount++
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' })
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    
    values.push(id)
    
    const query = `
      UPDATE codigos_descuento
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `
    
    const result = await pool.query(query, values)
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Código no encontrado' })
    }
    
    logger.info(`Código de influencer actualizado: ${id}`)
    
    res.json({
      success: true,
      code: result.rows[0]
    })
  } catch (error) {
    logger.error('Error updating influencer code:', error)
    res.status(500).json({ error: 'Error al actualizar código de influencer' })
  }
}

export const deleteCode = async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      'UPDATE codigos_descuento SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Código no encontrado' })
    }
    
    logger.info(`Código de influencer desactivado: ${id}`)
    
    res.json({
      success: true,
      message: 'Código desactivado correctamente'
    })
  } catch (error) {
    logger.error('Error deleting influencer code:', error)
    res.status(500).json({ error: 'Error al desactivar código de influencer' })
  }
}

export const getCodeStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE activo = true) as active_codes,
        COUNT(*) FILTER (WHERE activo = false) as inactive_codes,
        COUNT(DISTINCT cd.id) as total_codes,
        COUNT(DISTINCT ucd.id) as total_uses,
        COALESCE(SUM(ucd.importe_descuento), 0) as total_discounts_given,
        COALESCE(SUM(ci.importe_comision), 0) as total_commissions_generated
      FROM codigos_descuento cd
      LEFT JOIN uso_codigos_descuento ucd ON cd.id = ucd.codigo_descuento_id
      LEFT JOIN comisiones_influencers ci ON cd.influencer_id = ci.influencer_id AND ci.tipo = 'compra'
    `)
    
    const topCodes = await pool.query(`
      SELECT 
        cd.codigo,
        cd.porcentaje_descuento,
        COUNT(ucd.id) as total_uses,
        COALESCE(SUM(ucd.importe_descuento), 0) as total_discount,
        COALESCE(SUM(ci.importe_comision), 0) as total_commission
      FROM codigos_descuento cd
      LEFT JOIN uso_codigos_descuento ucd ON cd.id = ucd.codigo_descuento_id
      LEFT JOIN comisiones_influencers ci ON cd.influencer_id = ci.influencer_id AND ci.tipo = 'compra'
      WHERE cd.activo = true
      GROUP BY cd.id, cd.codigo, cd.porcentaje_descuento
      ORDER BY total_uses DESC
      LIMIT 10
    `)
    
    res.json({
      success: true,
      stats: stats.rows[0],
      topCodes: topCodes.rows
    })
  } catch (error) {
    logger.error('Error fetching code stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

export const getCodeUsage = async (req, res) => {
  try {
    const { id } = req.params
    
    const usage = await pool.query(`
      SELECT 
        ucd.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        o.id as order_id,
        o.created_at as order_date
      FROM uso_codigos_descuento ucd
      JOIN users u ON ucd.user_id = u.id
      LEFT JOIN orders o ON ucd.order_id = o.id
      WHERE ucd.codigo_descuento_id = $1
      ORDER BY ucd.fecha_uso DESC
    `, [id])
    
    res.json({
      success: true,
      usage: usage.rows
    })
  } catch (error) {
    logger.error('Error fetching code usage:', error)
    res.status(500).json({ error: 'Error al obtener uso de código' })
  }
}
