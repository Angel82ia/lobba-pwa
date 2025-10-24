/**
 * Validación y Sanitización de Secretos
 *
 * Este módulo valida que todos los secrets requeridos estén configurados
 * y proporciona wrappers seguros para servicios externos que sanitizan errores
 */

/**
 * Secrets requeridos en producción
 * En desarrollo, algunos pueden ser opcionales
 */
const REQUIRED_SECRETS = {
  // Críticos - Siempre requeridos
  critical: ['JWT_SECRET', 'DATABASE_URL', 'STRIPE_SECRET_KEY'],

  // Importantes - Requeridos en producción
  production: [
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_RESERVATION_WEBHOOK_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ],

  // Opcionales - Features específicas
  optional: [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    // Twilio removido - ahora solo usamos wa.me links (no requiere API)
  ],
}

/**
 * Validar que los secrets requeridos estén configurados
 * @throws {Error} Si faltan secrets críticos
 */
export const validateSecrets = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isTest = process.env.NODE_ENV === 'test'

  // En tests, no validar secrets (solo retornar warnings si falta algo)
  if (isTest) {
    const testWarnings = []

    // Revisar opcionales para tests que los necesiten
    for (const secret of REQUIRED_SECRETS.optional) {
      if (!process.env[secret] || process.env[secret] === 'undefined') {
        testWarnings.push(secret)
      }
    }

    return { valid: true, warnings: testWarnings }
  }

  const missing = {
    critical: [],
    production: [],
    optional: [],
  }

  // Validar secrets críticos
  for (const secret of REQUIRED_SECRETS.critical) {
    if (!process.env[secret] || process.env[secret] === 'undefined') {
      missing.critical.push(secret)
    }
  }

  // Validar secrets de producción
  if (isProduction) {
    for (const secret of REQUIRED_SECRETS.production) {
      if (!process.env[secret] || process.env[secret] === 'undefined') {
        missing.production.push(secret)
      }
    }
  }

  // Validar secrets opcionales (solo warnings)
  for (const secret of REQUIRED_SECRETS.optional) {
    if (!process.env[secret] || process.env[secret] === 'undefined') {
      missing.optional.push(secret)
    }
  }

  // Reportar resultados
  const errors = []
  const warnings = []

  if (missing.critical.length > 0) {
    errors.push(`❌ CRITICAL: Missing required secrets: ${missing.critical.join(', ')}`)
  }

  if (missing.production.length > 0 && isProduction) {
    errors.push(`⚠️  PRODUCTION: Missing production secrets: ${missing.production.join(', ')}`)
  }

  if (missing.optional.length > 0) {
    warnings.push(`ℹ️  OPTIONAL: Missing optional secrets: ${missing.optional.join(', ')}`)
    warnings.push('   Some features may be disabled.')
  }

  // Si hay errores críticos, lanzar excepción
  if (errors.length > 0) {
    console.error('\n🚨 SECRET VALIDATION FAILED\n')
    errors.forEach(error => console.error(error))
    console.error('\nApplication cannot start without required secrets.')
    console.error('Please check your .env file or environment variables.\n')

    throw new Error('Missing required secrets. Check logs for details.')
  }

  // Mostrar warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  SECRET WARNINGS\n')
    warnings.forEach(warning => console.warn(warning))
    console.warn('')
  }

  // Success
  console.log('✅ All required secrets validated')

  return {
    valid: true,
    warnings: missing.optional,
  }
}

/**
 * Sanitizar errores para evitar exponer secrets en logs
 * @param {Error} error - Error original
 * @param {string} context - Contexto del error (ej: 'stripe', 'google')
 * @returns {Object} Error sanitizado
 */
export const sanitizeError = (error, context = 'unknown') => {
  const sanitized = {
    message: error.message || 'Unknown error',
    context,
    timestamp: new Date().toISOString(),
  }

  // Sanitizar mensajes que pueden contener secrets
  const sensitivePatterns = [
    /sk_[a-z]+_[a-zA-Z0-9]+/g, // Stripe secret keys
    /pk_[a-z]+_[a-zA-Z0-9]+/g, // Stripe public keys
    /[A-Za-z0-9_-]{40,}/g, // Tokens largos
    /Bearer\s+[A-Za-z0-9_-]+/g, // Bearer tokens
    /api[_-]?key[=:]\s*[^\s]+/gi, // API keys
  ]

  let sanitizedMessage = sanitized.message

  sensitivePatterns.forEach(pattern => {
    sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]')
  })

  sanitized.message = sanitizedMessage

  // Agregar metadata útil sin exponer secrets
  if (error.type) sanitized.type = error.type
  if (error.code) sanitized.code = error.code
  if (error.statusCode) sanitized.statusCode = error.statusCode

  return sanitized
}

/**
 * Wrapper seguro para Stripe
 * Sanitiza errores antes de propagarlos
 */
export class SafeStripe {
  constructor(apiKey) {
    if (!apiKey || apiKey === 'undefined') {
      throw new Error('Stripe API key not configured')
    }

    // Validar formato básico de la key
    if (!apiKey.startsWith('sk_')) {
      throw new Error('Invalid Stripe API key format')
    }

    // Importar Stripe dinámicamente
    this.initStripe(apiKey)
  }

  async initStripe(apiKey) {
    const Stripe = (await import('stripe')).default
    this.stripe = new Stripe(apiKey)
  }

  /**
   * Wrapper para cualquier llamada a Stripe API
   * Sanitiza errores automáticamente
   */
  async safeCall(method, ...args) {
    try {
      return await method.apply(this.stripe, args)
    } catch (error) {
      const sanitized = sanitizeError(error, 'stripe')

      // Loguear error sanitizado
      console.error('Stripe API error (sanitized):', sanitized)

      // Re-lanzar error sanitizado
      const safeError = new Error(sanitized.message)
      safeError.type = sanitized.type
      safeError.code = sanitized.code
      safeError.statusCode = sanitized.statusCode
      throw safeError
    }
  }

  // Acceso directo al cliente Stripe (para compatibilidad)
  get client() {
    return this.stripe
  }
}

/**
 * Verificar que una secret específica existe
 * @param {string} secretName - Nombre de la variable de entorno
 * @returns {boolean}
 */
export const hasSecret = secretName => {
  return !!(process.env[secretName] && process.env[secretName] !== 'undefined')
}

/**
 * Obtener secret de forma segura
 * @param {string} secretName - Nombre de la variable de entorno
 * @param {string} defaultValue - Valor por defecto
 * @returns {string}
 */
export const getSecret = (secretName, defaultValue = null) => {
  const value = process.env[secretName]

  if (!value || value === 'undefined') {
    if (defaultValue !== null) {
      return defaultValue
    }
    throw new Error(`Secret ${secretName} is not configured`)
  }

  return value
}

/**
 * Verificar estado de secrets opcionales
 * @returns {Object} Estado de cada feature
 */
export const getFeatureStatus = () => {
  return {
    email: hasSecret('SMTP_HOST') && hasSecret('SMTP_USER'),
    push: hasSecret('FIREBASE_PROJECT_ID') && hasSecret('FIREBASE_PRIVATE_KEY'),
    whatsapp: true, // wa.me links siempre disponibles (no requiere API key)
    googleCalendar: hasSecret('GOOGLE_CLIENT_ID') && hasSecret('GOOGLE_CLIENT_SECRET'),
    stripe: hasSecret('STRIPE_SECRET_KEY'),
    stripeWebhooks:
      hasSecret('STRIPE_WEBHOOK_SECRET') && hasSecret('STRIPE_RESERVATION_WEBHOOK_SECRET'),
  }
}
