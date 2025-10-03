import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as AuditLog from '../../src/models/AuditLog.js'
import pool from '../../src/config/database.js'

vi.mock('../../src/config/database.js')

describe('AuditLog Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createAuditLog', () => {
    it('should create a new audit log entry', async () => {
      const mockLog = {
        id: '123',
        user_id: 'user-1',
        action: 'auth',
        resource_type: 'user',
        resource_id: 'user-1',
        details: { method: 'POST', path: '/api/auth/login' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date()
      }

      pool.query.mockResolvedValue({ rows: [mockLog] })

      const result = await AuditLog.createAuditLog({
        userId: 'user-1',
        action: 'auth',
        resourceType: 'user',
        resourceId: 'user-1',
        details: { method: 'POST', path: '/api/auth/login' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(result).toEqual(mockLog)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      )
    })
  })

  describe('findAuditLogs', () => {
    it('should find audit logs with filters', async () => {
      const mockLogs = [
        { id: '1', action: 'auth', user_email: 'user@test.com' },
        { id: '2', action: 'admin_action', user_email: 'admin@test.com' }
      ]

      pool.query.mockResolvedValue({ rows: mockLogs })

      const result = await AuditLog.findAuditLogs({ 
        action: 'auth',
        page: 1, 
        limit: 50 
      })

      expect(result).toEqual(mockLogs)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const mockStats = [
        { action: 'auth', count: '10', day: new Date() },
        { action: 'admin_action', count: '5', day: new Date() }
      ]

      pool.query.mockResolvedValue({ rows: mockStats })

      const result = await AuditLog.getAuditStats(30)

      expect(result).toEqual(mockStats)
      expect(pool.query).toHaveBeenCalled()
    })
  })

  describe('getUserAuditTrail', () => {
    it('should get audit trail for a specific user', async () => {
      const mockLogs = [
        { id: '1', user_id: 'user-1', action: 'auth' },
        { id: '2', user_id: 'user-1', action: 'user_action' }
      ]

      pool.query.mockResolvedValue({ rows: mockLogs })

      const result = await AuditLog.getUserAuditTrail('user-1', { page: 1, limit: 50 })

      expect(result).toEqual(mockLogs)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        expect.any(Array)
      )
    })
  })
})
