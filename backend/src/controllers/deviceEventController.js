import * as DeviceEvent from '../models/DeviceEvent.js'
import * as UsePermission from '../models/UsePermission.js'
import logger from '../utils/logger.js'

export const createEvent = async (req, res) => {
  if (req.user.role !== 'device' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { deviceId, permissionId, eventType, eventData } = req.body
    
    if (!deviceId || !eventType) {
      return res.status(400).json({ message: 'ID de dispositivo y tipo de evento son requeridos' })
    }
    
    const event = await DeviceEvent.createEvent({
      deviceId,
      permissionId,
      eventType,
      eventData
    })
    
    res.status(201).json(event)
  } catch (error) {
    logger.error('Create event error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getDeviceEvents = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'device') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { deviceId } = req.params
    const { page, limit, eventType, status } = req.query
    
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    }
    
    if (eventType) options.eventType = eventType
    if (status) options.status = status
    
    const events = await DeviceEvent.findDeviceEvents(deviceId, options)
    
    res.json(events)
  } catch (error) {
    logger.error('Get device events error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getUserEvents = async (req, res) => {
  try {
    const userId = req.user.id
    const { page, limit } = req.query
    
    const events = await DeviceEvent.findUserEvents(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    })
    
    res.json(events)
  } catch (error) {
    logger.error('Get user events error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getEventsByPermission = async (req, res) => {
  try {
    const { permissionId } = req.params
    
    const permission = await UsePermission.findPermissionById(permissionId)
    
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado' })
    }
    
    if (permission.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' })
    }
    
    const events = await DeviceEvent.findEventsByPermission(permissionId)
    
    res.json(events)
  } catch (error) {
    logger.error('Get events by permission error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getRecentErrors = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { deviceId, hours, limit } = req.query
    
    const options = {
      hours: hours ? parseInt(hours) : 24,
      limit: limit ? parseInt(limit) : 50
    }
    
    if (deviceId) options.deviceId = deviceId
    
    const errors = await DeviceEvent.findRecentErrors(options)
    
    res.json(errors)
  } catch (error) {
    logger.error('Get recent errors error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getDeviceStats = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'device') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { deviceId } = req.params
    const { days } = req.query
    
    const stats = await DeviceEvent.getDeviceStats(deviceId, {
      days: days ? parseInt(days) : 7
    })
    
    res.json(stats)
  } catch (error) {
    logger.error('Get device stats error:', error)
    res.status(500).json({ message: error.message })
  }
}
