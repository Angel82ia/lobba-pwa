import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CheckoutForm from './CheckoutForm'
import * as cartService from '../../services/cart'

vi.mock('../../services/cart')
vi.mock('../../services/checkout')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders checkout form', async () => {
    cartService.getCart.mockResolvedValue({
      items: [
        {
          id: '1',
          product_name: 'Test Product',
          base_price: '10.00',
          quantity: 2,
        },
      ],
    })

    render(
      <BrowserRouter>
        <CheckoutForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/checkout/i)).toBeInTheDocument()
    })
  })

  it('displays cart items summary', async () => {
    cartService.getCart.mockResolvedValue({
      items: [
        {
          id: '1',
          product_name: 'Test Product',
          base_price: '10.00',
          quantity: 2,
        },
      ],
    })

    render(
      <BrowserRouter>
        <CheckoutForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/test product/i)).toBeInTheDocument()
    })
  })

  it('shows shipping method options', async () => {
    cartService.getCart.mockResolvedValue({
      items: [{ id: '1', product_name: 'Test', base_price: '10.00', quantity: 1 }],
    })

    render(
      <BrowserRouter>
        <CheckoutForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/estándar/i)).toBeInTheDocument()
      expect(screen.getByText(/exprés/i)).toBeInTheDocument()
      expect(screen.getByText(/click & collect/i)).toBeInTheDocument()
    })
  })

  it('displays error when cart fetch fails', async () => {
    cartService.getCart.mockRejectedValue({
      response: { data: { message: 'Error al cargar el carrito' } }
    })

    render(
      <BrowserRouter>
        <CheckoutForm />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Error al cargar el carrito')).toBeInTheDocument()
    })
  })
})
