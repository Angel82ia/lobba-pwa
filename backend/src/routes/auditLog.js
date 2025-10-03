import express from 'express'
import * as auditLogController from '../controllers/auditLogController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimits.js'

const router = express.Router()

router.get('/', requireAuth, requireRole(['admin']), adminLimiter, auditLogController.getAuditLogs)
router.get('/stats', requireAuth, requireRole(['admin']), adminLimiter, auditLogController.getAuditStats)
router.get('/user/:userId', requireAuth, auditLogController.getUserAuditTrail)

export default router
