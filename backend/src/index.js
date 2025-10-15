import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import salonRoutes from './routes/salon.js'
import deviceRoutes from './routes/device.js'
import reservationRoutes from './routes/reservation.js'
import messageRoutes from './routes/message.js'
import productRoutes from './routes/product.js'
import categoryRoutes from './routes/category.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/order.js'
import checkoutRoutes from './routes/checkout.js'
import wishlistRoutes from './routes/wishlist.js'
import webhookRoutes from './routes/webhook.js'
import notificationRoutes from './routes/notification.js'
import chatbotRoutes from './routes/chatbot.js'
import bannerRoutes from './routes/banner.js'
import aiRoutes from './routes/ai.js'
import postRoutes from './routes/post.js'
import commentRoutes from './routes/comment.js'
import communityRoutes from './routes/community.js'
import catalogRoutes from './routes/catalog.js'
import itemRoutes from './routes/item.js'
import equipmentRoutes from './routes/equipment.js'
import permissionRoutes from './routes/permission.js'
import deviceEventRoutes from './routes/deviceEvent.js'
import auditLogRoutes from './routes/auditLog.js'
import membershipRoutes from './routes/membership.js'
import stripeConnectRoutes from './routes/stripeConnect.js'
import reservationCheckoutRoutes from './routes/reservationCheckout.js'
import csvImportRoutes from './routes/csvImport.js'
import passport from './config/passport.js'
import { initializeWebSocket } from './websocket/index.js'
import logger from './utils/logger.js'
import { generalLimiter } from './middleware/rateLimits.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

const io = initializeWebSocket(httpServer)
app.set('io', io)

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true)
} else {
  app.set('trust proxy', false)
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://openrouter.ai',
          'https://yce.perfectcorp.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)
// Configuración de CORS para múltiples orígenes
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

app.use('/api/webhooks', webhookRoutes)

app.use(express.json())
app.use(cookieParser())
app.use(morgan('combined'))
app.use(passport.initialize())
app.use(generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/salon', salonRoutes)
app.use('/api/device', deviceRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/device-events', deviceEventRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/membership', membershipRoutes)
app.use('/api/stripe-connect', stripeConnectRoutes)
app.use('/api/reservations/checkout', reservationCheckoutRoutes)
app.use('/api/admin/salons/import', csvImportRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ error: 'Something went wrong!' })
})

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Backend with WebSocket running on port ${PORT}`)
  })
}

export default app
