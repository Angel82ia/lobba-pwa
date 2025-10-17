import { Server } from 'socket.io'
import setupChatHandlers from './chat.js'

export const initializeWebSocket = httpServer => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173']

  // Función para validar si un origen es seguro
  const isAllowedOrigin = origin => {
    if (!origin) return true

    // Verificar si está en la lista de orígenes permitidos
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return true
    }

    // Permitir preview deployments de Vercel de forma segura
    // Patrón específico: https://lobba-pwa-vite-*.vercel.app
    const vercelPattern = /^https:\/\/lobba-pwa-vite-[a-zA-Z0-9-]+\.vercel\.app$/
    if (vercelPattern.test(origin)) {
      return true
    }

    return false
  }

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  setupChatHandlers(io)

  return io
}
