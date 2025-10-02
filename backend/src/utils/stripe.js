import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createPaymentIntent = async ({ amount, currency = 'eur', metadata }) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  })
}

export const confirmPaymentIntent = async (paymentIntentId) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

export const createRefund = async (paymentIntentId, amount) => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  })
}

export const calculateCommission = (amount, type = 'lobba_product') => {
  const rate = type === 'lobba_product' ? 0.15 : 0.03
  return amount * rate
}
