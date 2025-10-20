import pool from '../config/database.js'
import logger from '../utils/logger.js'
import { validarCodigoDescuento, validarUsoCodigoDescuento } from './influencerCodeService.js'

const DESCUENTO_MAXIMO = 0.25

export const calcularDescuentoCompra = async (userId, importeOriginal, codigoDescuento = null) => {
  try {
    const membership = await pool.query(
      `SELECT membership_type 
       FROM memberships 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    )
    
    let descuentoBase = 0
    let membershipType = null
    
    if (membership.rows.length > 0) {
      membershipType = membership.rows[0].membership_type
      descuentoBase = membershipType === 'spirit' ? 0.15 : 0.10
    }
    
    let descuentoCodigo = 0
    let codigoValido = null
    let puedeUsarCodigo = false
    
    if (codigoDescuento) {
      puedeUsarCodigo = await validarUsoCodigoDescuento(userId)
      
      if (!puedeUsarCodigo) {
        logger.warn(`Usuario ${userId} ya usó un código de descuento previamente`)
      } else {
        codigoValido = await validarCodigoDescuento(codigoDescuento)
        
        if (codigoValido) {
          descuentoCodigo = codigoValido.porcentaje_descuento / 100
          logger.info(`Código válido ${codigoDescuento}: ${descuentoCodigo * 100}% descuento adicional`)
        } else {
          logger.warn(`Código de descuento inválido: ${codigoDescuento}`)
        }
      }
    }
    
    let descuentoTotal = descuentoBase + descuentoCodigo
    
    if (descuentoTotal > DESCUENTO_MAXIMO) {
      descuentoTotal = DESCUENTO_MAXIMO
      logger.info(`Descuento limitado al máximo ${DESCUENTO_MAXIMO * 100}%`)
    }
    
    const importeDescuento = importeOriginal * descuentoTotal
    const importeFinal = importeOriginal - importeDescuento
    
    let comisionInfluencer = 0
    if (codigoValido && descuentoCodigo > 0) {
      comisionInfluencer = importeOriginal * (codigoValido.porcentaje_comision / 100)
    }
    
    return {
      importeOriginal,
      membershipType,
      descuentoBasePorcentaje: descuentoBase,
      descuentoCodigoPorcentaje: descuentoCodigo,
      descuentoTotalPorcentaje: descuentoTotal,
      importeDescuentoBase: importeOriginal * descuentoBase,
      importeDescuentoCodigo: importeOriginal * descuentoCodigo,
      importeDescuentoTotal: importeDescuento,
      importeFinal,
      comisionInfluencer,
      codigoAplicado: codigoValido?.codigo || null,
      codigoDescuentoId: codigoValido?.id || null,
      puedeUsarCodigo,
      codigoUsado: codigoValido !== null && descuentoCodigo > 0
    }
  } catch (error) {
    logger.error('Error calculando descuento de compra:', error)
    throw error
  }
}

export const registrarUsoCodigoDescuento = async (userId, orderId, calculoDescuento) => {
  if (!calculoDescuento.codigoUsado) {
    return null
  }
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const result = await client.query(
      `INSERT INTO uso_codigos_descuento (
        user_id,
        codigo_descuento_id,
        order_id,
        importe_pedido,
        descuento_base_membresia,
        descuento_codigo,
        descuento_total_aplicado,
        importe_descuento,
        importe_final,
        comision_influencer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        calculoDescuento.codigoDescuentoId,
        orderId,
        calculoDescuento.importeOriginal,
        calculoDescuento.descuentoBasePorcentaje * 100,
        calculoDescuento.descuentoCodigoPorcentaje * 100,
        calculoDescuento.descuentoTotalPorcentaje * 100,
        calculoDescuento.importeDescuentoTotal,
        calculoDescuento.importeFinal,
        calculoDescuento.comisionInfluencer
      ]
    )
    
    await client.query(
      'UPDATE users SET ha_usado_codigo_compra = TRUE WHERE id = $1',
      [userId]
    )
    
    const codigo = await client.query(
      'SELECT influencer_id FROM codigos_descuento WHERE id = $1',
      [calculoDescuento.codigoDescuentoId]
    )
    
    if (codigo.rows.length > 0) {
      await client.query(
        `INSERT INTO comisiones_influencers (
          influencer_id,
          user_referido_id,
          tipo,
          order_id,
          importe_base,
          porcentaje_comision,
          importe_comision,
          estado
        ) VALUES ($1, $2, 'compra', $3, $4, $5, $6, 'pendiente')`,
        [
          codigo.rows[0].influencer_id,
          userId,
          orderId,
          calculoDescuento.importeOriginal,
          (calculoDescuento.comisionInfluencer / calculoDescuento.importeOriginal) * 100,
          calculoDescuento.comisionInfluencer
        ]
      )
      
      logger.info(`Comisión generada para influencer ${codigo.rows[0].influencer_id}: €${calculoDescuento.comisionInfluencer}`)
    }
    
    await client.query('COMMIT')
    
    logger.info(`Uso de código registrado para usuario ${userId}, pedido ${orderId}`)
    
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Error registrando uso de código de descuento:', error)
    throw error
  } finally {
    client.release()
  }
}

export const verificarDisponibilidadCodigo = async (userId) => {
  try {
    const puedeUsar = await validarUsoCodigoDescuento(userId)
    
    if (!puedeUsar) {
      const usoExistente = await pool.query(
        `SELECT 
          ucd.fecha_uso,
          cd.codigo
         FROM uso_codigos_descuento ucd
         JOIN codigos_descuento cd ON ucd.codigo_descuento_id = cd.id
         WHERE ucd.user_id = $1`,
        [userId]
      )
      
      if (usoExistente.rows.length > 0) {
        return {
          puedeUsar: false,
          razon: 'Ya has usado un código de descuento anteriormente',
          codigoUsado: usoExistente.rows[0].codigo,
          fechaUso: usoExistente.rows[0].fecha_uso
        }
      }
    }
    
    return {
      puedeUsar: true,
      razon: null
    }
  } catch (error) {
    logger.error('Error verificando disponibilidad de código:', error)
    throw error
  }
}
