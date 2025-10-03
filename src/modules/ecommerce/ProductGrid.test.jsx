import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductGrid from './ProductGrid'
import * as productService from '../../services/product'

vi.mock('../../services/product')

describe('ProductGrid Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    productService.getProducts.mockImplementation(() => new Promise(() => {}))
    
    render(
      <MemoryRouter>
        <ProductGrid />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/cargando productos/i)).toBeInTheDocument()
  })

  it('should display products when loaded', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        base_price: '29.99',
        brand: 'LOBBA',
        images: [],
      },
    ]

    productService.getProducts.mockResolvedValue(mockProducts)
    
    render(
      <MemoryRouter>
        <ProductGrid />
      </MemoryRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  it('should display error when products fetch fails', async () => {
    productService.getProducts.mockRejectedValue({
      response: { data: { message: 'Error al cargar los productos' } }
    })

    render(
      <MemoryRouter>
        <ProductGrid />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los productos')).toBeInTheDocument()
    })
  })

  it('should display no products message when empty', async () => {
    productService.getProducts.mockResolvedValue([])

    render(
      <MemoryRouter>
        <ProductGrid />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No se encontraron productos')).toBeInTheDocument()
    })
  })
})
