import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Wishlist from './Wishlist'
import * as wishlistService from '../../services/wishlist'
import * as cartService from '../../services/cart'

vi.mock('../../services/wishlist')
vi.mock('../../services/cart')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    wishlistService.getWishlist.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('renders empty wishlist message', async () => {
    wishlistService.getWishlist.mockResolvedValue([])

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/tu lista de deseos está vacía/i)).toBeInTheDocument()
    })
  })

  it('renders wishlist items', async () => {
    wishlistService.getWishlist.mockResolvedValue([
      {
        product_id: '1',
        product_name: 'Test Product',
        base_price: '29.99',
        discount_percentage: 0,
        slug: 'test-product',
      },
    ])

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('29.99€')).toBeInTheDocument()
    })
  })

  it('displays discounted price correctly', async () => {
    wishlistService.getWishlist.mockResolvedValue([
      {
        product_id: '1',
        product_name: 'Discounted Product',
        base_price: '100.00',
        discount_percentage: 20,
        slug: 'discounted-product',
      },
    ])

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('80.00€')).toBeInTheDocument()
      expect(screen.getByText('-20%')).toBeInTheDocument()
    })
  })

  it('handles remove from wishlist', async () => {
    wishlistService.getWishlist.mockResolvedValue([
      {
        product_id: '1',
        product_name: 'Test Product',
        base_price: '29.99',
        slug: 'test-product',
      },
    ])
    wishlistService.removeFromWishlist.mockResolvedValue({})

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    const removeButton = screen.getByText(/eliminar/i)
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(wishlistService.removeFromWishlist).toHaveBeenCalledWith('1')
    })
  })

  it('handles add to cart', async () => {
    wishlistService.getWishlist.mockResolvedValue([
      {
        product_id: '1',
        product_name: 'Test Product',
        base_price: '29.99',
        slug: 'test-product',
      },
    ])
    cartService.addToCart.mockResolvedValue({})

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    const addToCartButton = screen.getByText(/añadir al carrito/i)
    fireEvent.click(addToCartButton)

    await waitFor(() => {
      expect(cartService.addToCart).toHaveBeenCalledWith('1', 1)
    })
  })

  it('displays error message on fetch failure', async () => {
    wishlistService.getWishlist.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/error al cargar la lista de deseos/i)).toBeInTheDocument()
    })
  })
})
