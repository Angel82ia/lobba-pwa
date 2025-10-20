import pool from '../config/database.js'
import * as Cart from '../models/Cart.js'
import * as Order from '../models/Order.js'
import { createPaymentIntent } from '../utils/stripe.js'
import { calculateCheckoutTotals } from '../services/membershipDiscountService.js'
import { calcularDescuentoCompra, registrarUsoCodigoDescuento, verificarDisponibilidadCodigo } from '../services/purchaseDiscountService.js'

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

    const { shippingMethod, discountCode } = req.body
    
    const discountCalculation = await calcularDescuentoCompra(
      req.user.id,
      totals.totalAfterDiscount,
      discountCode
    )
    
    const shippingCost = totals.shipping.shippingCost

    const tax = totals.subtotal * 0.21
    const finalTotal = discountCalculation.importeFinal + shippingCost + tax

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
      amount: finalTotal,
      metadata: {
        userId: req.user.id,
        cartId: cart.id,
        orderId: tempOrder.id,
        membershipType: totals.discount.membershipType || 'none',
        membershipDiscount: totals.discount.discountAmount || 0,
        discountCode: discountCalculation.codigoAplicado || null,
        codeDiscount: discountCalculation.importeDescuentoCodigo || 0,
        totalDiscount: discountCalculation.importeDescuentoTotal || 0,
        influencerCommission: discountCalculation.comisionInfluencer || 0,
      },
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal: totals.subtotal,
      membershipDiscount: totals.discount.discountAmount,
      membershipType: totals.discount.membershipType,
      codeDiscount: discountCalculation.importeDescuentoCodigo,
      codeDiscountPercentage: discountCalculation.descuentoCodigoPorcentaje * 100,
      totalDiscount: discountCalculation.importeDescuentoTotal,
      codeApplied: discountCalculation.codigoAplicado,
      canUseCode: discountCalculation.puedeUsarCodigo,
      shippingCost,
      freeShipping: totals.shipping.freeShipping,
      tax,
      total: finalTotal,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, shippingAddress, shippingMethod, discountCode } = req.body

    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)

    const cartItems = cartWithItems.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variant_id: item.variant_id
    }))

    const totals = await calculateCheckoutTotals(req.user.id, cartItems)
    
    const discountCalculation = await calcularDescuentoCompra(
      req.user.id,
      totals.totalAfterDiscount,
      discountCode
    )

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
    const finalTotal = discountCalculation.importeFinal + shippingCost + tax

    const order = await Order.createOrder({
      userId: req.user.id,
      items: orderItems,
      shippingMethod,
      shippingAddress,
      subtotal: totals.subtotal,
      shippingCost,
      tax,
      total: finalTotal,
    })

    await Order.updateStripePaymentIntent(order.id, paymentIntentId, 'processing')
    await Order.updateOrderStatus(order.id, 'pending')

    await pool.query(
      `UPDATE orders 
       SET seller = $1,
           type = $2,
           membership_discount = $3,
           membership_type = $4,
           free_shipping = $5,
           code_discount = $6,
           code_applied = $7,
           total_discount = $8,
           influencer_commission = $9
       WHERE id = $10`,
      [
        'LOBBA',
        'product_order',
        totals.discount.discountAmount || 0,
        totals.discount.membershipType,
        totals.shipping.freeShipping,
        discountCalculation.importeDescuentoCodigo || 0,
        discountCalculation.codigoAplicado || null,
        discountCalculation.importeDescuentoTotal || 0,
        discountCalculation.comisionInfluencer || 0,
        order.id
      ]
    )

    if (discountCalculation.codigoUsado) {
      await registrarUsoCodigoDescuento(req.user.id, order.id, discountCalculation)
    }

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

export const validateDiscountCode = async (req, res) => {
  try {
    const { discountCode } = req.body
    
    if (!discountCode) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Código de descuento requerido' 
      })
    }

    const canUseCode = await verificarDisponibilidadCodigo(req.user.id)
    
    if (!canUseCode.puedeUsar) {
      return res.status(400).json({
        valid: false,
        message: canUseCode.razon,
        codeUsed: canUseCode.codigoUsado,
        dateUsed: canUseCode.fechaUso
      })
    }

    const cart = await Cart.findOrCreateCart(req.user.id)
    const cartWithItems = await Cart.getCartWithItems(cart.id)

    if (cartWithItems.items.length === 0) {
      return res.status(400).json({ 
        valid: false, 
        message: 'El carrito está vacío' 
      })
    }

    const cartItems = cartWithItems.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variant_id: item.variant_id
    }))

    const totals = await calculateCheckoutTotals(req.user.id, cartItems)

    const discountCalculation = await calcularDescuentoCompra(
      req.user.id,
      totals.totalAfterDiscount,
      discountCode
    )

    if (!discountCalculation.codigoAplicado) {
      return res.status(400).json({
        valid: false,
        message: 'Código de descuento inválido o expirado'
      })
    }

    res.json({
      valid: true,
      code: discountCalculation.codigoAplicado,
      discountPercentage: discountCalculation.descuentoCodigoPorcentaje * 100,
      discountAmount: discountCalculation.importeDescuentoCodigo,
      totalDiscount: discountCalculation.importeDescuentoTotal,
      totalAfterDiscount: discountCalculation.importeFinal,
      message: `Código aplicado: ${discountCalculation.descuentoCodigoPorcentaje * 100}% de descuento`
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
