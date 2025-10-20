import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  initiateAuth,
  handleCallback,
  getCalendars,
  setCalendar,
  syncNow,
  setupWebhook,
  handleWebhook,
  disconnect,
} from '../controllers/googleCalendarController.js'

const router = express.Router()

router.get('/auth/:salonId', requireAuth, initiateAuth)

router.get('/callback', handleCallback)

router.get('/calendars/:salonId', requireAuth, getCalendars)

router.post('/set-calendar/:salonId', requireAuth, setCalendar)

router.post('/sync/:salonId', requireAuth, syncNow)

router.post('/webhook/setup/:salonId', requireAuth, setupWebhook)

router.post('/webhook', handleWebhook)

router.delete('/disconnect/:salonId', requireAuth, disconnect)

export default router
