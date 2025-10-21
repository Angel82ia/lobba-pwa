const isDevelopment = process.env.NODE_ENV !== 'production'

export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false,
  // Use a more secure key generator when behind a proxy
  keyGenerator: req => {
    // Try to get the real IP first, fallback to connection remote address
    const realIp =
      req.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.get('x-real-ip') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      req.ip
    return realIp || 'unknown'
  },
}

export const rateLimitPresets = {
  general: {
    max: isDevelopment ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  auth: {
    max: isDevelopment ? 100 : 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  },
  aiGeneration: {
    max: isDevelopment ? 100 : 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many AI generation requests, please try again later.',
  },
  payment: {
    max: isDevelopment ? 100 : 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many payment requests, please try again later.',
  },
  deviceValidation: {
    max: isDevelopment ? 200 : 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many device validation attempts, please try again later.',
  },
  admin: {
    max: isDevelopment ? 1000 : 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  chatbot: {
    max: isDevelopment ? 300 : 30,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many chatbot requests, please try again later.',
  },
}
