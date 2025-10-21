import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StripeCardElement from './StripeCardElement'

// Mock the hook
vi.mock('../../hooks/useStripePayment', () => ({
  useCardElementOptions: () => ({
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Inter", sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146',
      },
    },
  }),
}))

// Mock Stripe CardElement
vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: ({ options }) => <div data-testid="stripe-card-element">{JSON.stringify(options)}</div>, // eslint-disable-line react/prop-types
}))

describe('StripeCardElement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Stripe CardElement', () => {
    render(<StripeCardElement />)
    
    expect(screen.getByTestId('stripe-card-element')).toBeInTheDocument()
    expect(screen.getByText(/pago seguro procesado por stripe/i)).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<StripeCardElement className="custom-class" />)
    
    // El className se aplica en el div que contiene el CardElement
    const container = screen.getByTestId('stripe-card-element').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('should hide security message when showSecurityMessage is false', () => {
    render(<StripeCardElement showSecurityMessage={false} />)
    
    expect(screen.queryByText(/pago seguro procesado por stripe/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('stripe-card-element')).toBeInTheDocument()
  })

  it('should use card element options from hook', () => {
    render(<StripeCardElement />)
    
    const cardElement = screen.getByTestId('stripe-card-element')
    const options = JSON.parse(cardElement.textContent)
    
    expect(options.style.base.fontSize).toBe('16px')
    expect(options.style.base.color).toBe('#424770')
    expect(options.style.invalid.color).toBe('#9e2146')
  })
})
