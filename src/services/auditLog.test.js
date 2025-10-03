import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auditLogService from './auditLog'
import apiClient from './api'

vi.mock('./api')

describe('AuditLog Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuditLogs', () => {
    it('should fetch audit logs with filters', async () => {
      const mockLogs = [
        { id: '1', action: 'auth' },
        { id: '2', action: 'admin_action' }
      ]

      apiClient.get.mockResolvedValue({ data: mockLogs })

      const result = await auditLogService.getAuditLogs({ action: 'auth' })

      expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', { 
        params: { action: 'auth' } 
      })
      expect(result).toEqual(mockLogs)
    })
  })

  describe('getAuditStats', () => {
    it('should fetch audit statistics', async () => {
      const mockStats = [
        { action: 'auth', count: '10' }
      ]

      apiClient.get.mockResolvedValue({ data: mockStats })

      const result = await auditLogService.getAuditStats(30)

      expect(apiClient.get).toHaveBeenCalledWith('/audit-logs/stats', { 
        params: { days: 30 } 
      })
      expect(result).toEqual(mockStats)
    })
  })

  describe('getUserAuditTrail', () => {
    it('should fetch user audit trail', async () => {
      const mockLogs = [
        { id: '1', user_id: 'user-1' }
      ]

      apiClient.get.mockResolvedValue({ data: mockLogs })

      const result = await auditLogService.getUserAuditTrail('user-1', 1, 50)

      expect(apiClient.get).toHaveBeenCalledWith('/audit-logs/user/user-1', { 
        params: { page: 1, limit: 50 } 
      })
      expect(result).toEqual(mockLogs)
    })
  })
})
