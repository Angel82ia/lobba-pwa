import * as Item from '../models/Item.js'

export const getAllItems = async (req, res) => {
  try {
    const { page, limit, category, isActive } = req.query
    
    const items = await Item.findAllItems({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      category: category || null,
      isActive: isActive !== undefined ? isActive === 'true' : true
    })
    
    res.json(items)
  } catch (error) {
    console.error('Get all items error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getItemById = async (req, res) => {
  try {
    const { id } = req.params
    const item = await Item.findItemById(id)
    
    if (!item) {
      return res.status(404).json({ message: 'Artículo no encontrado' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const createItem = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { name, description, category, imageUrl, isConsumable, stockQuantity, monthlyLimit } = req.body
    
    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' })
    }
    
    const item = await Item.createItem({
      name,
      description,
      category,
      imageUrl,
      isConsumable,
      stockQuantity,
      monthlyLimit
    })
    
    res.status(201).json(item)
  } catch (error) {
    console.error('Create item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateItem = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { id } = req.params
    const item = await Item.updateItem(id, req.body)
    
    if (!item) {
      return res.status(404).json({ message: 'Artículo no encontrado' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const deleteItem = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { id } = req.params
    const item = await Item.deleteItem(id)
    
    if (!item) {
      return res.status(404).json({ message: 'Artículo no encontrado' })
    }
    
    res.json({ message: 'Artículo eliminado correctamente' })
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateStock = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso de administrador requerido' })
  }
  
  try {
    const { id } = req.params
    const { quantity } = req.body
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'La cantidad es requerida' })
    }
    
    const item = await Item.updateStock(id, parseInt(quantity))
    
    if (!item) {
      return res.status(404).json({ message: 'Artículo no encontrado' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Update stock error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const checkStock = async (req, res) => {
  try {
    const { id } = req.params
    const stock = await Item.checkStock(id)
    
    res.json({ stock })
  } catch (error) {
    console.error('Check stock error:', error)
    res.status(500).json({ message: error.message })
  }
}
