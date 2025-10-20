import pool from '../config/database.js'
import logger from '../utils/logger.js'

export const validarCodigoInfluencer = async (codigo) => {
  if (!codigo) return null
  
  try {
    const result = await pool.query(
      `SELECT id, codigo, nombre_influencer, porcentaje_comision_primera_cuota
       FROM codigos_influencers
       WHERE codigo = $1
         AND activo = TRUE
         AND (fecha_fin_contrato IS NULL OR fecha_fin_contrato > NOW())`,
      [codigo.toUpperCase().trim()]
    )
    
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    logger.error('Error validando código influencer:', error)
    throw error
  }
}

export const calcularPrimeraCuota = async (userId, membershipType) => {
  try {
    const user = await pool.query(
      `SELECT 
        codigo_referido,
        tipo_descuento_aplicado,
        referred_by
       FROM users
       WHERE id = $1`,
      [userId]
    )
    
    if (user.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }
    
    const userData = user.rows[0]
    const cuotaBase = membershipType === 'essential' ? 50 : 80
    
    const refMembership = await pool.query(
      `SELECT * FROM referral_memberships WHERE user_id = $1`,
      [userId]
    )
    
    if (refMembership.rows.length > 0) {
      return {
        cuotaOriginal: cuotaBase,
        descuentoPorcentaje: 1.00,
        importeDescuento: cuotaBase,
        cuotaAPagar: 0,
        comisionInfluencer: 0,
        ingresoLOBBA: 0,
        tipo: 'referido_amigas',
        descripcion: 'Mes gratis por programa de referidos (11 cuotas totales)'
      }
    }
    
    if (userData.codigo_referido) {
      const DESCUENTO_TOTAL = 0.20
      const COMISION_INFLUENCER = 0.10
      const DESCUENTO_REAL_USUARIO = 0.10
      
      const importeDescuento = cuotaBase * DESCUENTO_TOTAL
      const cuotaAPagar = cuotaBase - importeDescuento
      const comisionInfluencer = cuotaBase * COMISION_INFLUENCER
      const ingresoLOBBA = cuotaAPagar - comisionInfluencer
      
      return {
        cuotaOriginal: cuotaBase,
        descuentoPorcentaje: DESCUENTO_TOTAL,
        importeDescuento,
        cuotaAPagar,
        comisionInfluencer,
        ingresoLOBBA,
        tipo: 'codigo_influencer',
        codigoUsado: userData.codigo_referido,
        descripcion: `20% descuento con código ${userData.codigo_referido} (10% usuario + 10% comisión)`
      }
    }
    
    return {
      cuotaOriginal: cuotaBase,
      descuentoPorcentaje: 0,
      importeDescuento: 0,
      cuotaAPagar: cuotaBase,
      comisionInfluencer: 0,
      ingresoLOBBA: cuotaBase,
      tipo: 'ninguno',
      descripcion: 'Sin descuento aplicado'
    }
  } catch (error) {
    logger.error('Error calculando primera cuota:', error)
    throw error
  }
}

export const generarComisionPrimeraCuota = async (userId, cuotaCalculada, paymentId) => {
  if (cuotaCalculada.tipo !== 'codigo_influencer' || cuotaCalculada.comisionInfluencer === 0) {
    return null
  }
  
  try {
    const user = await pool.query(
      'SELECT codigo_referido FROM users WHERE id = $1',
      [userId]
    )
    
    if (user.rows.length === 0) return null
    
    const influencer = await pool.query(
      'SELECT id FROM codigos_influencers WHERE codigo = $1',
      [user.rows[0].codigo_referido]
    )
    
    if (influencer.rows.length === 0) return null
    
    const result = await pool.query(
      `INSERT INTO comisiones_influencers (
        influencer_id,
        user_referido_id,
        tipo,
        membership_payment_id,
        importe_base,
        porcentaje_comision,
        importe_comision,
        estado
      ) VALUES ($1, $2, 'primera_cuota', $3, $4, 10.00, $5, 'pendiente')
      RETURNING *`,
      [
        influencer.rows[0].id,
        userId,
        paymentId,
        cuotaCalculada.cuotaOriginal,
        cuotaCalculada.comisionInfluencer
      ]
    )
    
    logger.info(`Comisión generada para influencer ${influencer.rows[0].id}: €${cuotaCalculada.comisionInfluencer}`)
    
    return result.rows[0]
  } catch (error) {
    logger.error('Error generando comisión primera cuota:', error)
    throw error
  }
}

export const validarCodigoDescuento = async (codigo) => {
  if (!codigo) return null
  
  try {
    const result = await pool.query(
      `SELECT 
        cd.id,
        cd.codigo,
        cd.porcentaje_descuento,
        cd.porcentaje_comision,
        cd.influencer_id,
        ci.nombre_influencer
       FROM codigos_descuento cd
       JOIN codigos_influencers ci ON cd.influencer_id = ci.id
       WHERE cd.codigo = $1
         AND cd.activo = TRUE
         AND (cd.fecha_expiracion IS NULL OR cd.fecha_expiracion > NOW())`,
      [codigo.toUpperCase().trim()]
    )
    
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    logger.error('Error validando código de descuento:', error)
    throw error
  }
}

export const validarUsoCodigoDescuento = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT ha_usado_codigo_compra FROM users WHERE id = $1',
      [userId]
    )
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }
    
    return !result.rows[0].ha_usado_codigo_compra
  } catch (error) {
    logger.error('Error validando uso de código:', error)
    throw error
  }
}
