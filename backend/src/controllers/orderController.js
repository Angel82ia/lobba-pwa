import * as Order from '../models/Order.js'
import { validationResult } from 'express-validator'
import logger from '../utils/logger.js'

export const getUserOrders = async (req, res) => {
  try {
    const { status, page, limit } = req.query
    const orders = await Order.findOrdersByUserId(req.user.id, {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    })
    res.json(orders)
  } catch (error) {
    logger.error('Get user orders error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findOrderById(id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(order)
  } catch (error) {
    logger.error('Get order error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (req.user.role !== 'admin' && req.user.role !== 'salon') {
    return res.status(403).json({ message: 'Admin or salon access required' })
  }

  try {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.updateOrderStatus(id, status)
    res.json(order)
  } catch (error) {
    logger.error('Update order status error:', error)
    res.status(500).json({ message: error.message })
  }
}
