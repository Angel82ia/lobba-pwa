import * as Cart from '../models/Cart.js'
import * as Order from '../models/Order.js'
import * as Product from '../models/Product.js'
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

    const paymentIntent = await createPaymentIntent({
      amount: total,
      metadata: {
        userId: req.user.id,
        cartId: cart.id,
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

      await Product.updateStock(
        item.product_id,
        (await Product.findProductById(item.product_id)).stock_quantity - item.quantity
      )
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

    await Order.updateStripePaymentIntent(order.id, paymentIntentId, 'succeeded')
    await Order.updateOrderStatus(order.id, 'paid')
    await Cart.clearCart(cart.id)

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
