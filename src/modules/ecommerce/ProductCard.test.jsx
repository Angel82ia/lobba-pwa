import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductCard from './ProductCard'

vi.mock('../../services/cart')
vi.mock('../../services/wishlist')

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    base_price: '29.99',
    discount_percentage: '0',
    brand: 'LOBBA',
    stock_quantity: 10,
    images: [],
  }

  it('should render product information', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('LOBBA')).toBeInTheDocument()
    expect(screen.getByText('29.99€')).toBeInTheDocument()
  })

  it('should show discount badge when product has discount', () => {
    const discountedProduct = { ...mockProduct, discount_percentage: '20' }
    
    render(
      <MemoryRouter>
        <ProductCard product={discountedProduct} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('-20%')).toBeInTheDocument()
  })

  it('should show NEW badge when product is new', () => {
    const newProduct = { ...mockProduct, is_new: true }
    
    render(
      <MemoryRouter>
        <ProductCard product={newProduct} />
      </MemoryRouter>
    )
    
    expect(screen.getByText('NUEVO')).toBeInTheDocument()
  })
})
