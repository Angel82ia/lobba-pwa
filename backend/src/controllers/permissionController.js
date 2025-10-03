import jwt from 'jsonwebtoken'
import * as UsePermission from '../models/UsePermission.js'
import * as Item from '../models/Item.js'
import * as Equipment from '../models/Equipment.js'
import * as UserQuota from '../models/UserQuota.js'
import * as DeviceProfile from '../models/DeviceProfile.js'

export const requestItemPermission = async (req, res) => {
  try {
    const userId = req.user.id
    const { deviceId, itemId } = req.body
    
    if (!deviceId || !itemId) {
      return res.status(400).json({ message: 'ID de dispositivo y artículo son requeridos' })
    }
    
    const item = await Item.findItemById(itemId)
    if (!item || !item.is_active) {
      return res.status(404).json({ message: 'Artículo no disponible' })
    }
    
    if (item.stock_quantity <= 0) {
      return res.status(400).json({ message: 'Artículo sin stock' })
    }
    
    const device = await DeviceProfile.findDeviceProfileById(deviceId)
    if (!device || !device.is_active) {
      return res.status(404).json({ message: 'Dispositivo no disponible' })
    }
    
    const quota = await UserQuota.getOrCreateQuota(userId)
    if (quota.items_used_this_month >= item.monthly_limit) {
      return res.status(403).json({ message: 'Límite mensual alcanzado para este artículo' })
    }
    
    const token = jwt.sign(
      { userId, deviceId, itemId, type: 'dispense' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    const permission = await UsePermission.createPermission({
      userId,
      deviceId,
      itemId,
      equipmentId: null,
      permissionType: 'dispense',
      token,
      expiresAt
    })
    
    res.status(201).json({
      permission,
      token,
      expiresAt,
      item: {
        name: item.name,
        description: item.description
      }
    })
  } catch (error) {
    console.error('Request item permission error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const requestEquipmentPickup = async (req, res) => {
  try {
    const userId = req.user.id
    const { deviceId, equipmentId } = req.body
    
    if (!deviceId || !equipmentId) {
      return res.status(400).json({ message: 'ID de dispositivo y equipo son requeridos' })
    }
    
    const equipment = await Equipment.findEquipmentById(equipmentId)
    if (!equipment || !equipment.is_active) {
      return res.status(404).json({ message: 'Equipo no disponible' })
    }
    
    if (equipment.status !== 'available') {
      return res.status(400).json({ message: 'Equipo no está disponible para préstamo' })
    }
    
    const device = await DeviceProfile.findDeviceProfileById(deviceId)
    if (!device || !device.is_active) {
      return res.status(404).json({ message: 'Dispositivo no disponible' })
    }
    
    const quota = await UserQuota.getOrCreateQuota(userId)
    if (quota.equipment_loans_active >= 3) {
      return res.status(403).json({ message: 'Límite de préstamos activos alcanzado (máximo 3)' })
    }
    
    const token = jwt.sign(
      { userId, deviceId, equipmentId, type: 'pickup' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    const permission = await UsePermission.createPermission({
      userId,
      deviceId,
      itemId: null,
      equipmentId,
      permissionType: 'pickup',
      token,
      expiresAt
    })
    
    res.status(201).json({
      permission,
      token,
      expiresAt,
      equipment: {
        name: equipment.name,
        description: equipment.description,
        maxLoanDays: equipment.max_loan_days
      }
    })
  } catch (error) {
    console.error('Request equipment pickup error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const requestEquipmentReturn = async (req, res) => {
  try {
    const userId = req.user.id
    const { deviceId, equipmentId } = req.body
    
    if (!deviceId || !equipmentId) {
      return res.status(400).json({ message: 'ID de dispositivo y equipo son requeridos' })
    }
    
    const equipment = await Equipment.findEquipmentById(equipmentId)
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    if (equipment.status !== 'on_loan') {
      return res.status(400).json({ message: 'Equipo no está en préstamo' })
    }
    
    const device = await DeviceProfile.findDeviceProfileById(deviceId)
    if (!device || !device.is_active) {
      return res.status(404).json({ message: 'Dispositivo no disponible' })
    }
    
    const token = jwt.sign(
      { userId, deviceId, equipmentId, type: 'return' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    const permission = await UsePermission.createPermission({
      userId,
      deviceId,
      itemId: null,
      equipmentId,
      permissionType: 'return',
      token,
      expiresAt
    })
    
    res.status(201).json({
      permission,
      token,
      expiresAt,
      equipment: {
        name: equipment.name,
        description: equipment.description
      }
    })
  } catch (error) {
    console.error('Request equipment return error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const validatePermission = async (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({ message: 'Token es requerido' })
    }
    
    const permission = await UsePermission.validatePermission(token)
    
    if (!permission) {
      return res.status(404).json({ message: 'Permiso inválido o expirado' })
    }
    
    res.json({
      valid: true,
      permission
    })
  } catch (error) {
    console.error('Validate permission error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.query
    
    const permissions = await UsePermission.findUserPermissions(userId, status || null)
    
    res.json(permissions)
  } catch (error) {
    console.error('Get user permissions error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getDevicePermissions = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'device') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { deviceId } = req.params
    const { status } = req.query
    
    const permissions = await UsePermission.findDevicePermissions(deviceId, status || null)
    
    res.json(permissions)
  } catch (error) {
    console.error('Get device permissions error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const cancelPermission = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    const permission = await UsePermission.findPermissionById(id)
    
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado' })
    }
    
    if (permission.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' })
    }
    
    if (permission.status !== 'pending') {
      return res.status(400).json({ message: 'Solo se pueden cancelar permisos pendientes' })
    }
    
    const cancelled = await UsePermission.cancelPermission(id)
    
    res.json(cancelled)
  } catch (error) {
    console.error('Cancel permission error:', error)
    res.status(500).json({ message: error.message })
  }
}
