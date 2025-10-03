import * as AuditLog from '../models/AuditLog.js'
import logger from '../utils/logger.js'

export const auditLog = (action, resourceType = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)
    
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const userId = req.user?.id || null
        const resourceId = data?.id || req.params?.id || null
        const ipAddress = req.ip || req.connection.remoteAddress
        const userAgent = req.get('user-agent')
        
        const details = {
          method: req.method,
          path: req.path,
          body: sanitizeBody(req.body),
          query: req.query,
          statusCode: res.statusCode
        }
        
        AuditLog.createAuditLog({
          userId,
          action,
          resourceType,
          resourceId,
          details,
          ipAddress,
          userAgent
        }).catch(error => {
          logger.error('Failed to create audit log:', error)
        })
      }
      
      return originalJson(data)
    }
    
    next()
  }
}

function sanitizeBody(body) {
  if (!body) return {}
  
  const sanitized = { ...body }
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey']
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

export const auditAuthAction = auditLog('auth', 'user')
export const auditUserAction = auditLog('user_action', 'user')
export const auditAdminAction = auditLog('admin_action', null)
export const auditDataAccess = auditLog('data_access', null)
export const auditDataModification = auditLog('data_modification', null)
export const auditDataDeletion = auditLog('data_deletion', null)
