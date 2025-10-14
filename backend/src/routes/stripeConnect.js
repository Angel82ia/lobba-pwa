import express from 'express'
import pool from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'
import { 
  createConnectAccount, 
  createAccountLink, 
  getAccountStatus,
  updateAccountStatus 
} from '../services/stripeConnectService.js'

const router = express.Router()

/**
 * Crear cuenta Stripe Connect para salón
 * POST /api/stripe-connect/create
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { salonProfileId, email, businessName } = req.body

    if (!salonProfileId || !email || !businessName) {
      return res.status(400).json({ error: 'Salon profile ID, email and business name are required' })
    }

    const salonResult = await pool.query(
      'SELECT * FROM salon_profiles WHERE id = $1 AND user_id = $2',
      [salonProfileId, userId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found or not owned by user' })
    }

    const salon = salonResult.rows[0]

    if (salon.stripe_connect_account_id) {
      return res.status(400).json({ error: 'Salon already has a Stripe Connect account' })
    }

    const account = await createConnectAccount(salonProfileId, email, businessName)

    const accountLink = await createAccountLink(account.id, salonProfileId)

    return res.status(201).json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url
    })

  } catch (error) {
    console.error('Error creating Connect account:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * Generar nuevo link de onboarding (si expiró el anterior)
 * POST /api/stripe-connect/refresh-link
 */
router.post('/refresh-link', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { salonProfileId } = req.body

    if (!salonProfileId) {
      return res.status(400).json({ error: 'Salon profile ID is required' })
    }

    const salonResult = await pool.query(
      'SELECT * FROM salon_profiles WHERE id = $1 AND user_id = $2',
      [salonProfileId, userId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found or not owned by user' })
    }

    const salon = salonResult.rows[0]

    if (!salon.stripe_connect_account_id) {
      return res.status(400).json({ error: 'Salon does not have a Stripe Connect account yet' })
    }

    const accountLink = await createAccountLink(salon.stripe_connect_account_id, salonProfileId)

    return res.status(200).json({
      success: true,
      onboardingUrl: accountLink.url
    })

  } catch (error) {
    console.error('Error refreshing account link:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * Obtener estado de cuenta Stripe Connect
 * GET /api/stripe-connect/status/:salonProfileId
 */
router.get('/status/:salonProfileId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user
    const { salonProfileId } = req.params

    const salonResult = await pool.query(
      'SELECT * FROM salon_profiles WHERE id = $1 AND user_id = $2',
      [salonProfileId, userId]
    )

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found or not owned by user' })
    }

    const salon = salonResult.rows[0]

    if (!salon.stripe_connect_account_id) {
      return res.status(200).json({
        success: true,
        hasAccount: false,
        onboarded: false,
        enabled: false
      })
    }

    const status = await updateAccountStatus(salonProfileId, salon.stripe_connect_account_id)

    return res.status(200).json({
      success: true,
      hasAccount: true,
      accountId: salon.stripe_connect_account_id,
      onboarded: status.onboarded,
      enabled: status.chargesEnabled && status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      requirements: status.requirements
    })

  } catch (error) {
    console.error('Error getting account status:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

/**
 * Webhook handler para actualizaciones de Stripe Connect
 * POST /api/stripe-connect/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body

    if (event.type === 'account.updated') {
      const accountId = event.data.object.id

      const salonResult = await pool.query(
        'SELECT id FROM salon_profiles WHERE stripe_connect_account_id = $1',
        [accountId]
      )

      if (salonResult.rows.length > 0) {
        await updateAccountStatus(salonResult.rows[0].id, accountId)
      }
    }

    return res.status(200).json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
