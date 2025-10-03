import * as Wishlist from '../models/Wishlist.js'
import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.getUserWishlist(req.user.id)
    res.json(wishlist)
  } catch (error) {
    logger.error('Get wishlist error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const addToWishlist = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { productId } = req.body
    const item = await Wishlist.addToWishlist(req.user.id, productId)
    res.status(201).json(item)
  } catch (error) {
    logger.error('Add to wishlist error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params
    await Wishlist.removeFromWishlist(req.user.id, productId)
    res.json({ message: 'Removed from wishlist' })
  } catch (error) {
    logger.error('Remove from wishlist error:', error)
    res.status(500).json({ message: error.message })
  }
}
