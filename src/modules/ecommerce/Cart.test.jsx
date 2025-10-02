import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart from './Cart'
import * as cartService from '../../services/cart'

vi.mock('../../services/cart')

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    cartService.getCart.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    )

    expect(screen.getByText(/cargando carrito/i)).toBeInTheDocument()
  })

  it('should display empty cart message', async () => {
    cartService.getCart.mockResolvedValue({ items: [] })

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument()
    })
  })

  it('should display cart items', async () => {
    const mockCart = {
      items: [
        {
          id: 'item-1',
          product_name: 'Test Product',
          base_price: '29.99',
          discount_percentage: '0',
          price_adjustment: '0',
          quantity: 2,
        },
      ],
    }

    cartService.getCart.mockResolvedValue(mockCart)

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })
})
