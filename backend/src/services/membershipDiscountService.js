import pool from '../config/database.js'
import { calcularDescuentoCompra } from './purchaseDiscountService.js'

/**
 * Obtener información de membresía del usuario
 */
export const getUserMembership = async (userId) => {
  const result = await pool.query(
    `SELECT m.*, u.email
     FROM memberships m
     INNER JOIN users u ON m.user_id = u.id
     WHERE m.user_id = $1 AND m.status = 'active'
     ORDER BY m.created_at DESC
     LIMIT 1`,
    [userId]
  )
  
  return result.rows[0] || null
}

/**
 * Calcular descuento de membresía según tipo
 * Essential: 10%
 * Spirit: 15%
 */
export const calculateMembershipDiscount = async (userId, subtotal) => {
  const membership = await getUserMembership(userId)
  
  if (!membership) {
    return {
      hasMembership: false,
      membershipType: null,
      discountPercentage: 0,
      discountAmount: 0,
      totalAfterDiscount: subtotal
    }
  }
  
  if (membership.end_date && new Date(membership.end_date) < new Date()) {
    return {
      hasMembership: false,
      membershipType: membership.membership_type,
      membershipExpired: true,
      discountPercentage: 0,
      discountAmount: 0,
      totalAfterDiscount: subtotal
    }
  }
  
  const discountPercentage = membership.membership_type === 'spirit' ? 15 : 10
  const discountAmount = (subtotal * discountPercentage) / 100
  
  return {
    hasMembership: true,
    membershipType: membership.membership_type,
    membershipId: membership.id,
    discountPercentage,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    totalAfterDiscount: parseFloat((subtotal - discountAmount).toFixed(2))
  }
}

/**
 * Calcular costo de envío según membresía
 * Essential: Gratis si subtotal >= 30€, sino 5.99€
 * Spirit: Gratis si subtotal >= 15€, sino 5.99€
 * Sin membresía: 5.99€ (gratis si >= 50€)
 */
export const calculateShipping = async (userId, subtotal) => {
  const membership = await getUserMembership(userId)
  
  const DEFAULT_SHIPPING_COST = 5.99
  let freeShippingThreshold = 50 // Default sin membresía
  
  if (membership && membership.end_date && new Date(membership.end_date) >= new Date()) {
    freeShippingThreshold = membership.membership_type === 'spirit' ? 15 : 30
  }
  
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : DEFAULT_SHIPPING_COST
  const freeShipping = shippingCost === 0
  
  return {
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    freeShipping,
    freeShippingThreshold,
    membershipType: membership?.membership_type || null
  }
}

/**
 * Calcular totales completos para checkout con código de descuento opcional
 */
export const calculateCheckoutTotals = async (userId, cartItems, codigoDescuento = null) => {
  let subtotal = 0
  for (const item of cartItems) {
    const productResult = await pool.query(
      'SELECT base_price, discount_percentage FROM products WHERE id = $1',
      [item.product_id]
    )
    
    if (productResult.rows[0]) {
      const product = productResult.rows[0]
      const price = product.base_price * (1 - product.discount_percentage / 100)
      subtotal += price * item.quantity
    }
  }
  
  subtotal = parseFloat(subtotal.toFixed(2))
  
  let discountInfo
  
  if (codigoDescuento) {
    discountInfo = await calcularDescuentoCompra(userId, subtotal, codigoDescuento)
  } else {
    const oldDiscountInfo = await calculateMembershipDiscount(userId, subtotal)
    discountInfo = {
      importeOriginal: subtotal,
      membershipType: oldDiscountInfo.membershipType,
      descuentoBasePorcentaje: oldDiscountInfo.discountPercentage / 100,
      descuentoCodigoPorcentaje: 0,
      descuentoTotalPorcentaje: oldDiscountInfo.discountPercentage / 100,
      importeDescuentoTotal: oldDiscountInfo.discountAmount,
      importeFinal: oldDiscountInfo.totalAfterDiscount,
      comisionInfluencer: 0,
      codigoAplicado: null
    }
  }
  
  const shippingInfo = await calculateShipping(userId, discountInfo.importeFinal)
  
  const total = parseFloat((discountInfo.importeFinal + shippingInfo.shippingCost).toFixed(2))
  
  return {
    subtotal,
    discount: discountInfo,
    shipping: shippingInfo,
    total,
    breakdown: {
      subtotal,
      membershipDiscount: discountInfo.importeDescuentoTotal,
      subtotalAfterDiscount: discountInfo.importeFinal,
      shippingCost: shippingInfo.shippingCost,
      total
    }
  }
}

/**
 * Verificar si usuario puede aplicar descuento de membresía compartida
 */
export const canUseSharedMembershipDiscount = async (userId) => {
  const result = await pool.query(
    `SELECT sm.*, m.membership_type, m.status
     FROM shared_memberships sm
     INNER JOIN memberships m ON sm.membership_id = m.id
     WHERE sm.shared_with_user_id = $1 
       AND sm.status = 'active'
       AND m.status = 'active'
     LIMIT 1`,
    [userId]
  )
  
  if (result.rows.length === 0) {
    return { canUse: false, membership: null }
  }
  
  const sharedMembership = result.rows[0]
  
  if (sharedMembership.end_date && new Date(sharedMembership.end_date) < new Date()) {
    return { canUse: false, membership: sharedMembership, reason: 'expired' }
  }
  
  return {
    canUse: true,
    membership: sharedMembership,
    membershipType: sharedMembership.membership_type
  }
}
