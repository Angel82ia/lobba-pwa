import express from 'express'
import { authenticateUser } from '../middleware/auth.js'
import {
  initiateAuth,
  handleCallback,
  getCalendars,
  setCalendar,
  syncNow,
  setupWebhook,
  handleWebhook,
  disconnect
} from '../controllers/googleCalendarController.js'

const router = express.Router()

router.get('/auth/:salonId', authenticateUser, initiateAuth)

router.get('/callback', handleCallback)

router.get('/calendars/:salonId', authenticateUser, getCalendars)

router.post('/set-calendar/:salonId', authenticateUser, setCalendar)

router.post('/sync/:salonId', authenticateUser, syncNow)

router.post('/webhook/setup/:salonId', authenticateUser, setupWebhook)

router.post('/webhook', handleWebhook)

router.delete('/disconnect/:salonId', authenticateUser, disconnect)

export default router
