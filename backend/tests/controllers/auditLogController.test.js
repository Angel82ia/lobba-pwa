import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auditLogController from '../../src/controllers/auditLogController.js'
import * as AuditLog from '../../src/models/AuditLog.js'

vi.mock('../../src/models/AuditLog.js')
vi.mock('../../src/utils/logger.js')

describe('AuditLog Controller', () => {
  let req, res

  beforeEach(() => {
    req = {
      user: { id: 'admin-1', role: 'admin' },
      query: {},
      params: {}
    }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    }
    vi.clearAllMocks()
  })

  describe('getAuditLogs', () => {
    it('should return audit logs for admin', async () => {
      const mockLogs = [
        { id: '1', action: 'auth' },
        { id: '2', action: 'admin_action' }
      ]

      AuditLog.findAuditLogs.mockResolvedValue(mockLogs)

      await auditLogController.getAuditLogs(req, res)

      expect(AuditLog.findAuditLogs).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(mockLogs)
    })

    it('should deny access for non-admin', async () => {
      req.user.role = 'user'

      await auditLogController.getAuditLogs(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' })
    })
  })

  describe('getAuditStats', () => {
    it('should return audit statistics for admin', async () => {
      const mockStats = [
        { action: 'auth', count: '10' },
        { action: 'admin_action', count: '5' }
      ]

      AuditLog.getAuditStats.mockResolvedValue(mockStats)

      await auditLogController.getAuditStats(req, res)

      expect(AuditLog.getAuditStats).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(mockStats)
    })

    it('should deny access for non-admin', async () => {
      req.user.role = 'user'

      await auditLogController.getAuditStats(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('getUserAuditTrail', () => {
    it('should return audit trail for own user', async () => {
      req.params.userId = 'admin-1'
      const mockLogs = [{ id: '1', user_id: 'admin-1' }]

      AuditLog.getUserAuditTrail.mockResolvedValue(mockLogs)

      await auditLogController.getUserAuditTrail(req, res)

      expect(AuditLog.getUserAuditTrail).toHaveBeenCalledWith('admin-1', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith(mockLogs)
    })

    it('should deny access when viewing other user trail without admin', async () => {
      req.user = { id: 'user-1', role: 'user' }
      req.params.userId = 'user-2'

      await auditLogController.getUserAuditTrail(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' })
    })

    it('should allow admin to view any user trail', async () => {
      req.params.userId = 'user-2'
      const mockLogs = [{ id: '1', user_id: 'user-2' }]

      AuditLog.getUserAuditTrail.mockResolvedValue(mockLogs)

      await auditLogController.getUserAuditTrail(req, res)

      expect(AuditLog.getUserAuditTrail).toHaveBeenCalledWith('user-2', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith(mockLogs)
    })
  })
})
