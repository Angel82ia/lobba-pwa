import pool from '../config/database.js'

/**
 * Middleware para verificar créditos AR antes de operaciones IA/AR
 * Sistema unificado: 50 créditos/mes para uñas, peinados y maquillaje
 * 
 * Uso:
 *   router.post('/ai/nails', checkARCredits('nails', 1), generateNails)
 *   router.post('/ai/hairstyle', checkARCredits('hairstyle', 1), tryHairstyle)
 *   router.post('/ai/makeup', checkARCredits('makeup', 1), tryMakeup)
 */
export function checkARCredits(featureType, creditsRequired = 1) {
  const validFeatures = ['nails', 'hairstyle', 'makeup']

  if (!validFeatures.includes(featureType)) {
    throw new Error(`INVALID_FEATURE_TYPE: ${featureType}`)
  }

  return async (req, res, next) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
        })
      }

      const userResult = await pool.query(
        `SELECT 
          id,
          email,
          first_name,
          last_name,
          ar_credits,
          ar_credits_used,
          ar_credits_reset_date
        FROM users 
        WHERE id = $1`,
        [userId]
      )

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        })
      }

      const user = userResult.rows[0]

      const now = new Date()
      const resetDate = new Date(user.ar_credits_reset_date)
      const needsReset =
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()

      let availableCredits
      if (needsReset) {
        availableCredits = user.ar_credits
      } else {
        availableCredits = Math.max(0, user.ar_credits - user.ar_credits_used)
      }

      if (availableCredits < creditsRequired) {
        const nextMonth = new Date(
          resetDate.getFullYear(),
          resetDate.getMonth() + 1,
          1
        )
        const daysUntilReset = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24))

        return res.status(403).json({
          error: 'INSUFFICIENT_AR_CREDITS',
          message: `No tienes suficientes créditos AR. Tienes ${availableCredits}, necesitas ${creditsRequired}.`,
          available: availableCredits,
          required: creditsRequired,
          total: user.ar_credits,
          reset_date: user.ar_credits_reset_date,
          days_until_reset: daysUntilReset,
          upgrade_suggestion:
            availableCredits === 0
              ? `Los créditos se renovarán automáticamente en ${daysUntilReset} días`
              : null,
        })
      }

      req.user = user
      req.arCreditsRequired = creditsRequired
      req.arFeatureType = featureType
      req.arAvailableCredits = availableCredits

      next()
    } catch (error) {
      console.error('Error checking AR credits:', error)
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al verificar créditos AR',
      })
    }
  }
}

/**
 * Middleware para consumir créditos AR después de operación exitosa
 * Debe usarse DESPUÉS del middleware principal de la ruta
 * 
 * Uso:
 *   router.post('/ai/nails', 
 *     checkARCredits('nails', 1),
 *     async (req, res) => {
 *       // Generar diseño...
 *       await consumeARCreditsAfterSuccess(req, res)
 *       res.json({ success: true, ... })
 *     }
 *   )
 */
export async function consumeARCredits(req, metadata = {}) {
  const user = req.user
  const featureType = req.arFeatureType
  const credits = req.arCreditsRequired || 1

  if (!user || !featureType) {
    throw new Error('AR_CREDITS_MIDDLEWARE_NOT_INITIALIZED')
  }

  try {
    const result = await pool.query(
      `SELECT * FROM consume_ar_credits($1, $2, $3, $4)`,
      [user.id, featureType, credits, JSON.stringify(metadata)]
    )

    const { success, remaining_credits, error_message } = result.rows[0]

    if (!success) {
      throw new Error(error_message || 'FAILED_TO_CONSUME_CREDITS')
    }

    console.log(
      `✅ Usuario ${user.id} consumió ${credits} crédito(s) AR para ${featureType}. Restantes: ${remaining_credits}`
    )

    return {
      success: true,
      remaining: remaining_credits,
      consumed: credits,
    }
  } catch (error) {
    console.error('Error consuming AR credits:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de uso AR del usuario actual
 */
export async function getARUsageStats(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM ar_credits_stats WHERE user_id = $1',
      [userId]
    )

    return (
      result.rows[0] || {
        total_uses: 0,
        nails_count: 0,
        hairstyle_count: 0,
        makeup_count: 0,
        last_use: null,
        usage_month: null,
      }
    )
  } catch (error) {
    console.error('Error fetching AR usage stats:', error)
    return {
      total_uses: 0,
      nails_count: 0,
      hairstyle_count: 0,
      makeup_count: 0,
      last_use: null,
      usage_month: null,
    }
  }
}

/**
 * Obtener información de créditos AR del usuario
 */
export async function getARCreditsInfo(userId) {
  try {
    const result = await pool.query(
      `SELECT 
        ar_credits,
        ar_credits_used,
        ar_credits_reset_date,
        (ar_credits - ar_credits_used) as available_credits
      FROM users 
      WHERE id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]

    const now = new Date()
    const resetDate = new Date(user.ar_credits_reset_date)
    const needsReset =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()

    if (needsReset) {
      user.available_credits = user.ar_credits
    }

    const nextMonth = new Date(
      resetDate.getFullYear(),
      resetDate.getMonth() + 1,
      1
    )
    const daysUntilReset = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24))

    return {
      total: user.ar_credits,
      used: needsReset ? 0 : user.ar_credits_used,
      available: user.available_credits,
      reset_date: user.ar_credits_reset_date,
      days_until_reset: daysUntilReset,
      needs_reset: needsReset,
    }
  } catch (error) {
    console.error('Error fetching AR credits info:', error)
    return null
  }
}
