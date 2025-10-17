import express from 'express'
import * as AnalyticsController from '../controllers/analyticsController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/salons/:salonId/dashboard', authenticate, AnalyticsController.getSalonDashboard)

router.get('/salons/:salonId/revenue/daily', authenticate, AnalyticsController.getDailyRevenue)

router.get('/salons/:salonId/revenue/monthly', authenticate, AnalyticsController.getMonthlyRevenue)

router.get('/salons/:salonId/clients/recurring', authenticate, AnalyticsController.getRecurringClients)

router.get('/salons/:salonId/clients/retention', authenticate, AnalyticsController.getClientRetention)

router.get('/salons/:salonId/busy-hours', authenticate, AnalyticsController.getBusyHours)

router.get('/salons/:salonId/busy-weekdays', authenticate, AnalyticsController.getBusyWeekdays)

router.get('/salons/:salonId/compare', authenticate, AnalyticsController.comparePeriods)

router.get('/salons/:salonId/services/performance', authenticate, AnalyticsController.getServicePerformance)

router.get('/salons/:salonId/conversion-rate', authenticate, AnalyticsController.getConversionRate)

router.get('/salons/:salonId/export', authenticate, AnalyticsController.exportReservationData)

export default router
