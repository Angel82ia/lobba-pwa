import * as Equipment from '../models/Equipment.js'

export const getAllEquipment = async (req, res) => {
  try {
    const { page, limit, status, category, isActive } = req.query
    
    const equipment = await Equipment.findAllEquipment({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status: status || null,
      category: category || null,
      isActive: isActive !== undefined ? isActive === 'true' : true
    })
    
    res.json(equipment)
  } catch (error) {
    console.error('Get all equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params
    const equipment = await Equipment.findEquipmentById(id)
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    res.json(equipment)
  } catch (error) {
    console.error('Get equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getAvailableEquipment = async (req, res) => {
  try {
    const { category } = req.query
    const equipment = await Equipment.findAvailableEquipment(category || null)
    
    res.json(equipment)
  } catch (error) {
    console.error('Get available equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const createEquipment = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { name, description, category, imageUrl, requiresReturn, maxLoanDays, currentLocation } = req.body
    
    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' })
    }
    
    const equipment = await Equipment.createEquipment({
      name,
      description,
      category,
      imageUrl,
      requiresReturn,
      maxLoanDays,
      currentLocation
    })
    
    res.status(201).json(equipment)
  } catch (error) {
    console.error('Create equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateEquipment = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { id } = req.params
    const equipment = await Equipment.updateEquipment(id, req.body)
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    res.json(equipment)
  } catch (error) {
    console.error('Update equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const deleteEquipment = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { id } = req.params
    const equipment = await Equipment.deleteEquipment(id)
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    res.json({ message: 'Equipo eliminado correctamente' })
  } catch (error) {
    console.error('Delete equipment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateEquipmentStatus = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'device') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ message: 'El estado es requerido' })
    }
    
    const validStatuses = ['available', 'on_loan', 'maintenance', 'retired']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }
    
    const equipment = await Equipment.updateEquipmentStatus(id, status)
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    res.json(equipment)
  } catch (error) {
    console.error('Update equipment status error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateEquipmentLocation = async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'device') {
    return res.status(403).json({ message: 'Acceso no autorizado' })
  }
  
  try {
    const { id } = req.params
    const { locationId } = req.body
    
    const equipment = await Equipment.updateEquipmentLocation(id, locationId)
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipo no encontrado' })
    }
    
    res.json(equipment)
  } catch (error) {
    console.error('Update equipment location error:', error)
    res.status(500).json({ message: error.message })
  }
}
