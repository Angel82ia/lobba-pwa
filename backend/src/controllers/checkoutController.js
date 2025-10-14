import pool from '../config/database.js'
import * as Cart from '../models/Cart.js'
import * as Order from '../models/Order.js'
import { createPaymentIntent } from '../utils/stripe.js'
import { calculateCheckoutTotals } from '../services/membershipDiscountService.js'

export const createPaymentIntentController = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)

    if (cartWithItems.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    const cartItems = cartWithItems.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variant_id: item.variant_id
    }))

    const totals = await calculateCheckoutTotals(req.user.id, cartItems)

    const { shippingMethod } = req.body
    
    const shippingCost = totals.shipping.shippingCost

    const tax = totals.subtotal * 0.21
    const total = totals.totalAfterDiscount + shippingCost + tax

    const tempOrder = await Order.createOrder({
      userId: req.user.id,
      items: cartWithItems.items.map(item => ({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.base_price) * (1 - parseFloat(item.discount_percentage || 0) / 100),
        subtotal: (parseFloat(item.base_price) * (1 - parseFloat(item.discount_percentage || 0) / 100)) * item.quantity,
        productName: item.product_name,
        productSnapshot: { name: item.product_name },
      })),
      shippingMethod: shippingMethod || 'standard',
      shippingAddress: {},
      subtotal: totals.subtotal,
      shippingCost,
      tax,
      total,
    })

    const paymentIntent = await createPaymentIntent({
      amount: total,
      metadata: {
        userId: req.user.id,
        cartId: cart.id,
        orderId: tempOrder.id,
        membershipType: totals.discount.membershipType || 'none',
        membershipDiscount: totals.discount.discountAmount || 0,
      },
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal: totals.subtotal,
      membershipDiscount: totals.discount.discountAmount,
      membershipType: totals.discount.membershipType,
      shippingCost,
      freeShipping: totals.shipping.freeShipping,
      tax,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, shippingAddress, shippingMethod } = req.body

    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)

    const cartItems = cartWithItems.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variant_id: item.variant_id
    }))

    const totals = await calculateCheckoutTotals(req.user.id, cartItems)

    const orderItems = []

    for (const item of cartWithItems.items) {
      const price = parseFloat(item.base_price)
      const discount = parseFloat(item.discount_percentage || 0)
      const adjustment = parseFloat(item.price_adjustment || 0)
      const finalPrice = price * (1 - discount / 100) + adjustment
      const itemSubtotal = finalPrice * item.quantity

      orderItems.push({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: finalPrice,
        subtotal: itemSubtotal,
        productName: item.product_name,
        productSnapshot: {
          name: item.product_name,
          brand: item.brand,
          variantName: item.variant_name,
        },
      })
    }

    const shippingCost = totals.shipping.shippingCost
    const tax = totals.subtotal * 0.21
    const total = totals.discount.totalAfterDiscount + shippingCost + tax

    const order = await Order.createOrder({
      userId: req.user.id,
      items: orderItems,
      shippingMethod,
      shippingAddress,
      subtotal: totals.subtotal,
      shippingCost,
      tax,
      total,
    })

    await Order.updateStripePaymentIntent(order.id, paymentIntentId, 'processing')
    await Order.updateOrderStatus(order.id, 'pending')

    await pool.query(
      `UPDATE orders 
       SET seller = $1,
           type = $2,
           membership_discount = $3,
           membership_type = $4,
           free_shipping = $5
       WHERE id = $6`,
      [
        'LOBBA',
        'product_order',
        totals.discount.discountAmount || 0,
        totals.discount.membershipType,
        totals.shipping.freeShipping,
        order.id
      ]
    )

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const calculateShipping = async (req, res) => {
  try {
    const { shippingMethod } = req.body
    
    const shippingCost = shippingMethod === 'express' ? 9.99 : 
                         shippingMethod === 'click_collect' ? 0 : 4.99

    res.json({ shippingCost })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
