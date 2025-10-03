import * as AuditLog from '../models/AuditLog.js'
import logger from '../utils/logger.js'

export const getAuditLogs = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { userId, action, resourceType, startDate, endDate, page, limit } = req.query
    
    const logs = await AuditLog.findAuditLogs({
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    })

    res.json(logs)
  } catch (error) {
    logger.error('Get audit logs error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getAuditStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { days = 30 } = req.query
    const stats = await AuditLog.getAuditStats(parseInt(days))
    
    res.json(stats)
  } catch (error) {
    logger.error('Get audit stats error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getUserAuditTrail = async (req, res) => {
  try {
    const { userId } = req.params
    
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { page, limit } = req.query
    const logs = await AuditLog.getUserAuditTrail(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    })

    res.json(logs)
  } catch (error) {
    logger.error('Get user audit trail error:', error)
    res.status(500).json({ message: error.message })
  }
}
