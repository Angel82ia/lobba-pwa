import pool from '../../config/database.js'
import logger from '../../utils/logger.js'

export const getAllCommissions = async (req, res) => {
  try {
    const { status, influencer_id, tipo, date_from, date_to } = req.query
    
    let query = `
      SELECT 
        ci.*,
        u_inf.first_name || ' ' || u_inf.last_name as influencer_name,
        u_inf.email as influencer_email,
        u_ref.first_name || ' ' || u_ref.last_name as referred_user_name,
        u_ref.email as referred_user_email,
        o.id as order_number,
        o.total as order_total
      FROM comisiones_influencers ci
      LEFT JOIN users u_inf ON ci.influencer_id = u_inf.id
      LEFT JOIN users u_ref ON ci.user_referido_id = u_ref.id
      LEFT JOIN orders o ON ci.order_id = o.id
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 1
    
    if (status) {
      query += ` AND ci.estado = $${paramCount}`
      params.push(status)
      paramCount++
    }
    
    if (influencer_id) {
      query += ` AND ci.influencer_id = $${paramCount}`
      params.push(influencer_id)
      paramCount++
    }
    
    if (tipo) {
      query += ` AND ci.tipo = $${paramCount}`
      params.push(tipo)
      paramCount++
    }
    
    if (date_from) {
      query += ` AND ci.created_at >= $${paramCount}`
      params.push(date_from)
      paramCount++
    }
    
    if (date_to) {
      query += ` AND ci.created_at <= $${paramCount}`
      params.push(date_to)
      paramCount++
    }
    
    query += ` ORDER BY ci.created_at DESC LIMIT 100`
    
    const result = await pool.query(query, params)
    
    res.json({
      success: true,
      commissions: result.rows
    })
  } catch (error) {
    logger.error('Error fetching commissions:', error)
    res.status(500).json({ error: 'Error al obtener comisiones' })
  }
}

export const getCommissionStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_commissions,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pending_count,
        COUNT(*) FILTER (WHERE estado = 'pagada') as paid_count,
        COUNT(*) FILTER (WHERE estado = 'cancelada') as cancelled_count,
        COALESCE(SUM(importe_comision) FILTER (WHERE estado = 'pendiente'), 0) as pending_amount,
        COALESCE(SUM(importe_comision) FILTER (WHERE estado = 'pagada'), 0) as paid_amount,
        COALESCE(SUM(importe_comision), 0) as total_amount,
        COUNT(DISTINCT influencer_id) as active_influencers
      FROM comisiones_influencers
    `)
    
    const topInfluencers = await pool.query(`
      SELECT 
        u.first_name || ' ' || u.last_name as influencer_name,
        u.email,
        COUNT(*) as total_commissions,
        COALESCE(SUM(ci.importe_comision), 0) as total_earned,
        COALESCE(SUM(ci.importe_comision) FILTER (WHERE ci.estado = 'pendiente'), 0) as pending_amount
      FROM comisiones_influencers ci
      JOIN users u ON ci.influencer_id = u.id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY total_earned DESC
      LIMIT 10
    `)
    
    const monthlyStats = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as commissions_count,
        COALESCE(SUM(importe_comision), 0) as total_amount
      FROM comisiones_influencers
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `)
    
    res.json({
      success: true,
      stats: stats.rows[0],
      topInfluencers: topInfluencers.rows,
      monthlyStats: monthlyStats.rows
    })
  } catch (error) {
    logger.error('Error fetching commission stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas de comisiones' })
  }
}

export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params
    const { payment_reference, payment_method, notes } = req.body
    
    const result = await pool.query(
      `UPDATE comisiones_influencers
       SET estado = 'pagada',
           fecha_pago = CURRENT_TIMESTAMP,
           metodo_pago = $1,
           referencia_pago = $2,
           notas_pago = $3
       WHERE id = $4
       RETURNING *`,
      [payment_method || 'manual', payment_reference || null, notes || null, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comisión no encontrada' })
    }
    
    logger.info(`Comisión marcada como pagada: ${id}`)
    
    res.json({
      success: true,
      commission: result.rows[0]
    })
  } catch (error) {
    logger.error('Error marking commission as paid:', error)
    res.status(500).json({ error: 'Error al marcar comisión como pagada' })
  }
}

export const getInfluencerCommissions = async (req, res) => {
  try {
    const { influencerId } = req.params
    
    const commissions = await pool.query(
      `SELECT 
        ci.*,
        u.first_name || ' ' || u.last_name as referred_user_name,
        u.email as referred_user_email,
        o.id as order_number
       FROM comisiones_influencers ci
       LEFT JOIN users u ON ci.user_referido_id = u.id
       LEFT JOIN orders o ON ci.order_id = o.id
       WHERE ci.influencer_id = $1
       ORDER BY ci.created_at DESC`,
      [influencerId]
    )
    
    const summary = await pool.query(
      `SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(importe_comision) FILTER (WHERE estado = 'pendiente'), 0) as pending_amount,
        COALESCE(SUM(importe_comision) FILTER (WHERE estado = 'pagada'), 0) as paid_amount,
        COALESCE(SUM(importe_comision), 0) as total_earned
       FROM comisiones_influencers
       WHERE influencer_id = $1`,
      [influencerId]
    )
    
    res.json({
      success: true,
      commissions: commissions.rows,
      summary: summary.rows[0]
    })
  } catch (error) {
    logger.error('Error fetching influencer commissions:', error)
    res.status(500).json({ error: 'Error al obtener comisiones del influencer' })
  }
}
