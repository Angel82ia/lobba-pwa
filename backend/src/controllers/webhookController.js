import Stripe from 'stripe'
import * as Order from '../models/Order.js'
import * as Product from '../models/Product.js'
import * as Cart from '../models/Cart.js'
import logger from '../utils/logger.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        break
      default:
        logger.info(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook:', error)
    res.status(500).json({ message: error.message })
  }
}

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const { id: paymentIntentId, metadata } = paymentIntent
  const { cartId, orderId } = metadata

  if (orderId) {
    await Order.updateStripePaymentIntent(orderId, paymentIntentId, 'succeeded')
    await Order.updateOrderStatus(orderId, 'paid')

    const order = await Order.findOrderById(orderId)
    
    for (const item of order.items) {
      const product = await Product.findProductById(item.product_id)
      await Product.updateStock(
        item.product_id,
        product.stock_quantity - item.quantity
      )
    }

    if (cartId) {
      await Cart.clearCart(cartId)
    }

    logger.info(`Payment succeeded for order ${orderId}`)
  }
}

const handlePaymentIntentFailed = async (paymentIntent) => {
  const { id: paymentIntentId, metadata } = paymentIntent
  const { orderId } = metadata

  if (orderId) {
    await Order.updateStripePaymentIntent(orderId, paymentIntentId, 'failed')
    await Order.updateOrderStatus(orderId, 'payment_failed')
    logger.info(`Payment failed for order ${orderId}`)
  }
}

const handleChargeRefunded = async (charge) => {
  const { payment_intent: paymentIntentId } = charge
  
  const order = await Order.findOrderByPaymentIntent(paymentIntentId)
  if (order) {
    await Order.updateOrderStatus(order.id, 'refunded')
    
    for (const item of order.items) {
      const product = await Product.findProductById(item.product_id)
      await Product.updateStock(
        item.product_id,
        product.stock_quantity + item.quantity
      )
    }
    
    logger.info(`Refund processed for order ${order.id}`)
  }
}
