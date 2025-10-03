import { validationResult } from 'express-validator'
import * as ProductCategory from '../models/ProductCategory.js'

export const getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.findAllCategories()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createCategory = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const category = await ProductCategory.createCategory(req.body)
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCategory = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { id } = req.params
    const category = await ProductCategory.updateCategory(id, req.body)
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteCategory = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  try {
    const { id } = req.params
    const category = await ProductCategory.deleteCategory(id)
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
