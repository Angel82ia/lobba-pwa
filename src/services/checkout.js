import apiClient from './api'

export const createPaymentIntent = async (shippingMethod) => {
  const response = await apiClient.post('/checkout/payment-intent', { shippingMethod })
  return response.data
}

export const confirmPayment = async (paymentIntentId, shippingAddress, shippingMethod) => {
  const response = await apiClient.post('/checkout/confirm', {
    paymentIntentId,
    shippingAddress,
    shippingMethod,
  })
  return response.data
}

export const calculateShipping = async (shippingMethod) => {
  const response = await apiClient.post('/checkout/shipping', { shippingMethod })
  return response.data
}
