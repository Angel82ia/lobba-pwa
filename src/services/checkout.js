import apiClient from './api'

export const createPaymentIntent = async (shippingMethod, discountCode = null) => {
  const response = await apiClient.post('/checkout/payment-intent', { 
    shippingMethod,
    discountCode 
  })
  return response.data
}

export const confirmPayment = async (paymentIntentId, shippingAddress, shippingMethod, discountCode = null) => {
  const response = await apiClient.post('/checkout/confirm', {
    paymentIntentId,
    shippingAddress,
    shippingMethod,
    discountCode,
  })
  return response.data
}

export const calculateShipping = async (shippingMethod) => {
  const response = await apiClient.post('/checkout/shipping', { shippingMethod })
  return response.data
}

export const validateDiscountCode = async (discountCode) => {
  const response = await apiClient.post('/checkout/validate-code', { discountCode })
  return response.data
}
