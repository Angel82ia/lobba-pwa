import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProductDetail from './ProductDetail'
import * as productService from '../../services/product'

vi.mock('../../services/product')
vi.mock('../../services/cart')

const renderWithRouter = (slug) => {
  return render(
    <MemoryRouter initialEntries={[`/producto/${slug}`]}>
      <Routes>
        <Route path="/producto/:slug" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProductDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    productService.getProductById.mockImplementation(() => new Promise(() => {}))

    renderWithRouter('test-product')

    expect(screen.getByText(/cargando producto/i)).toBeInTheDocument()
  })

  it('should display product details', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      base_price: '29.99',
      discount_percentage: '0',
      description: 'Test description',
      stock_quantity: 10,
      images: [],
      variants: [],
    }

    productService.getProductById.mockResolvedValue(mockProduct)

    renderWithRouter('test-product')

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })
})
