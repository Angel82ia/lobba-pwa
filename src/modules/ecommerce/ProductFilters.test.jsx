import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProductFilters from './ProductFilters'
import * as productService from '../../services/product'

vi.mock('../../services/product')

describe('ProductFilters Component', () => {
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    productService.getCategories.mockResolvedValue([])
  })

  it('should render filter controls', async () => {
    render(<ProductFilters onFilterChange={mockOnFilterChange} />)

    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument()
      expect(screen.getByText('Categoría')).toBeInTheDocument()
      expect(screen.getByText('Precio')).toBeInTheDocument()
    })
  })

  it('should load categories', async () => {
    const mockCategories = [{ id: '1', name: 'Maquillaje' }]
    productService.getCategories.mockResolvedValue(mockCategories)

    render(<ProductFilters onFilterChange={mockOnFilterChange} />)

    await waitFor(() => {
      expect(screen.getByText('Maquillaje')).toBeInTheDocument()
    })
  })
})
