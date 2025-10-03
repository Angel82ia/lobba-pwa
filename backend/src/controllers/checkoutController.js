import * as Cart from '../models/Cart.js'
import * as Order from '../models/Order.js'
import { createPaymentIntent } from '../utils/stripe.js'

export const createPaymentIntentController = async (req, res) => {
  try {
    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)

    if (cartWithItems.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    let subtotal = 0
    for (const item of cartWithItems.items) {
      const price = parseFloat(item.base_price)
      const discount = parseFloat(item.discount_percentage || 0)
      const adjustment = parseFloat(item.price_adjustment || 0)
      const finalPrice = price * (1 - discount / 100) + adjustment
      subtotal += finalPrice * item.quantity
    }

    const { shippingMethod } = req.body
    const shippingCost = shippingMethod === 'express' ? 9.99 : 
                         shippingMethod === 'click_collect' ? 0 : 4.99

    const tax = subtotal * 0.21
    const total = subtotal + shippingCost + tax

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
      subtotal,
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
      },
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal,
      shippingCost,
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

    const orderItems = []
    let subtotal = 0

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

      subtotal += itemSubtotal
    }

    const shippingCost = shippingMethod === 'express' ? 9.99 : 
                         shippingMethod === 'click_collect' ? 0 : 4.99
    const tax = subtotal * 0.21
    const total = subtotal + shippingCost + tax

    const order = await Order.createOrder({
      userId: req.user.id,
      items: orderItems,
      shippingMethod,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      total,
    })

    await Order.updateStripePaymentIntent(order.id, paymentIntentId, 'processing')
    await Order.updateOrderStatus(order.id, 'pending')

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
