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
import passport from './config/passport.js'
import { initializeWebSocket } from './websocket/index.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

const io = initializeWebSocket(httpServer)
app.set('io', io)

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('combined'))
app.use(passport.initialize())

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/salon', salonRoutes)
app.use('/api/device', deviceRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/messages', messageRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

httpServer.listen(PORT, () => {
  console.log(`Backend with WebSocket running on port ${PORT}`)
})

export default app
