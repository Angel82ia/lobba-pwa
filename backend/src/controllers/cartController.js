import * as Cart from '../models/Cart.js'
import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)
    res.json(cartWithItems)
  } catch (error) {
    logger.error('Get cart error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const addToCart = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { productId, variantId, quantity } = req.body
    const cart = await Cart.findOrCreateCart(req.user.id)
    
    const item = await Cart.addItemToCart({
      cartId: cart.id,
      productId,
      variantId,
      quantity: quantity || 1,
    })

    res.status(201).json(item)
  } catch (error) {
    logger.error('Add to cart error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateCartItem = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { id } = req.params
    const { quantity } = req.body

    const item = await Cart.updateCartItem(id, quantity)
    res.json(item)
  } catch (error) {
    logger.error('Update cart item error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params
    await Cart.removeItemFromCart(id)
    res.json({ message: 'Item removed from cart' })
  } catch (error) {
    logger.error('Remove from cart error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateCart(req.user.id)
    await Cart.clearCart(cart.id)
    res.json({ message: 'Cart cleared' })
  } catch (error) {
    logger.error('Clear cart error:', error)
    res.status(500).json({ message: error.message })
  }
}
