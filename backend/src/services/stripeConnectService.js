import Stripe from 'stripe'
import pool from '../config/database.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * Crear cuenta Stripe Connect para un salón
 */
export const createConnectAccount = async (salonProfileId, email, businessName) => {
  try {
    console.log('[Stripe Connect] Creating account for:', { salonProfileId, email, businessName })

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: businessName,
        product_description: 'Servicios de belleza y bienestar',
      },
    })

    console.log('[Stripe Connect] Account created:', account.id)

    await pool.query(
      `UPDATE salon_profiles 
       SET stripe_connect_account_id = $1,
           stripe_connect_created_at = CURRENT_TIMESTAMP,
           stripe_connect_updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [account.id, salonProfileId]
    )

    return account
  } catch (error) {
    console.error('[Stripe Connect] Error creating account:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      details: error.raw?.message || error.toString(),
    })
    // Propagar el error real de Stripe
    throw error
  }
}

/**
 * Generar link de onboarding para completar verificación Stripe
 */
export const createAccountLink = async (accountId, salonProfileId) => {
  try {
    console.log('[Stripe Connect] Creating account link for:', accountId)
    console.log('[Stripe Connect] URLs:', {
      refresh: `${process.env.FRONTEND_URL}/salon/connect/refresh?salon_id=${salonProfileId}`,
      return: `${process.env.FRONTEND_URL}/salon/connect/return?salon_id=${salonProfileId}`,
    })

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/salon/connect/refresh?salon_id=${salonProfileId}`,
      return_url: `${process.env.FRONTEND_URL}/salon/connect/return?salon_id=${salonProfileId}`,
      type: 'account_onboarding',
    })

    console.log('[Stripe Connect] Account link created:', accountLink.url)
    return accountLink
  } catch (error) {
    console.error('[Stripe Connect] Error creating account link:', {
      message: error.message,
      type: error.type,
      code: error.code,
      details: error.raw?.message || error.toString(),
    })
    // Propagar el error real de Stripe
    throw error
  }
}

/**
 * Obtener estado de cuenta Stripe Connect
 */
export const getAccountStatus = async accountId => {
  try {
    const account = await stripe.accounts.retrieve(accountId)

    return {
      id: account.id,
      onboarded: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
    }
  } catch (error) {
    console.error('Error retrieving account status:', error)
    throw new Error('Error al obtener estado de cuenta')
  }
}

/**
 * Actualizar estado de cuenta Connect en DB
 */
export const updateAccountStatus = async (salonProfileId, accountId) => {
  try {
    const status = await getAccountStatus(accountId)

    await pool.query(
      `UPDATE salon_profiles 
       SET stripe_connect_onboarded = $1,
           stripe_connect_enabled = $2,
           stripe_connect_charges_enabled = $3,
           stripe_connect_payouts_enabled = $4,
           stripe_connect_updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        status.onboarded,
        status.chargesEnabled && status.payoutsEnabled,
        status.chargesEnabled,
        status.payoutsEnabled,
        salonProfileId,
      ]
    )

    return status
  } catch (error) {
    console.error('Error updating account status:', error)
    throw new Error('Error al actualizar estado de cuenta')
  }
}

/**
 * @deprecated OBSOLETO - No usar. Payment Intent se crea directamente en reservationCheckoutController
 * @see processReservationCheckout en reservationCheckoutController.js
 *
 * Esta función se mantiene solo para compatibilidad temporal
 * Crear Split Payment (3% LOBBA, 97% Salón)
 */
export const createSplitPayment = async reservation => {
  try {
    const salonResult = await pool.query(
      'SELECT stripe_connect_account_id, stripe_connect_enabled FROM salon_profiles WHERE id = $1',
      [reservation.salon_profile_id]
    )

    if (salonResult.rows.length === 0) {
      throw new Error('Salón no encontrado')
    }

    const salon = salonResult.rows[0]

    if (!salon.stripe_connect_account_id || !salon.stripe_connect_enabled) {
      throw new Error('El salón no tiene Stripe Connect configurado')
    }

    const totalAmount = parseFloat(reservation.total_price)
    const commissionPercentage = parseFloat(reservation.commission_percentage || 3)
    const commissionAmount = (totalAmount * commissionPercentage) / 100
    const amountToCommerce = totalAmount - commissionAmount

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'eur',
      application_fee_amount: Math.round(commissionAmount * 100),
      transfer_data: {
        destination: salon.stripe_connect_account_id,
      },
      metadata: {
        reservation_id: reservation.id,
        salon_profile_id: reservation.salon_profile_id,
        service_id: reservation.service_id,
        user_id: reservation.user_id,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount.toFixed(2),
        amount_to_commerce: amountToCommerce.toFixed(2),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    await pool.query(
      `UPDATE reservations 
       SET stripe_payment_intent_id = $1,
           payment_status = 'pending',
           commission_amount = $2,
           amount_to_lobba = $3,
           amount_to_commerce = $4
       WHERE id = $5`,
      [paymentIntent.id, commissionAmount, commissionAmount, amountToCommerce, reservation.id]
    )

    return paymentIntent
  } catch (error) {
    console.error('Error creating split payment:', error)
    throw error
  }
}

/**
 * Confirmar pago de reserva tras éxito
 */
export const confirmReservationPayment = async paymentIntentId => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('El pago no se completó exitosamente')
    }

    await pool.query(
      `UPDATE reservations 
       SET payment_status = 'succeeded',
           status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = $1`,
      [paymentIntentId]
    )

    return paymentIntent
  } catch (error) {
    console.error('Error confirming reservation payment:', error)
    throw error
  }
}

/**
 * Procesar reembolso (devuelve dinero al cliente y cancela transferencia al salón)
 */
export const refundReservationPayment = async (reservationId, reason = '') => {
  try {
    const reservationResult = await pool.query(
      'SELECT stripe_payment_intent_id, total_price FROM reservations WHERE id = $1',
      [reservationId]
    )

    if (reservationResult.rows.length === 0) {
      throw new Error('Reserva no encontrada')
    }

    const reservation = reservationResult.rows[0]

    if (!reservation.stripe_payment_intent_id) {
      throw new Error('La reserva no tiene pago asociado')
    }

    const refund = await stripe.refunds.create({
      payment_intent: reservation.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: {
        reservation_id: reservationId,
        refund_reason: reason,
      },
    })

    await pool.query(
      `UPDATE reservations 
       SET payment_status = 'refunded',
           status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           cancellation_reason = $2
       WHERE id = $1`,
      [reservationId, reason || 'Reembolso solicitado']
    )

    return refund
  } catch (error) {
    console.error('Error refunding reservation payment:', error)
    throw error
  }
}
