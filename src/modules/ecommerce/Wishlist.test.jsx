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
      expect(screen.getByText('Discounted Product')).toBeInTheDocument()
      // Final price should be 100 - 20% = 80
      expect(screen.getByText('80.00€')).toBeInTheDocument()
      // Original price with strikethrough
      expect(screen.getByText('100.00€')).toBeInTheDocument()
    })
  })

  it('handles remove from wishlist', async () => {
    const mockItems = [
      {
        product_id: '1',
        product_name: 'Test Product',
        base_price: '29.99',
        discount_percentage: 0,
        slug: 'test-product',
      },
    ]

    wishlistService.getWishlist.mockResolvedValue(mockItems)
    wishlistService.removeFromWishlist.mockResolvedValue({ success: true })

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    // Find remove button by text (❌ emoji)
    const removeButton = screen.getByText('❌')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(wishlistService.removeFromWishlist).toHaveBeenCalledWith('1')
    })
  })

  it('handles add to cart', async () => {
    const mockItems = [
      {
        product_id: '1',
        product_name: 'Test Product',
        base_price: '29.99',
        discount_percentage: 0,
        slug: 'test-product',
      },
    ]

    wishlistService.getWishlist.mockResolvedValue(mockItems)
    cartService.addToCart.mockResolvedValue({ success: true })

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })

    const addToCartButton = screen.getByText(/Al Carrito/)
    fireEvent.click(addToCartButton)

    await waitFor(() => {
      expect(cartService.addToCart).toHaveBeenCalledWith('1', null, 1)
    })
  })

  it('handles errors gracefully', async () => {
    wishlistService.getWishlist.mockRejectedValue(new Error('Failed to load'))

    render(
      <BrowserRouter>
        <Wishlist />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar la lista de deseos/)).toBeInTheDocument()
    })
  })
})
