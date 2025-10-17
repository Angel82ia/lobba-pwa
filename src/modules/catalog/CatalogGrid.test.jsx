import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CatalogGrid from './CatalogGrid'
import * as catalogService from '../../services/catalog'

vi.mock('../../services/catalog')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('CatalogGrid', () => {
  const mockDesigns = [
    {
      id: '1',
      name: 'Pink Nails',
      type: 'nails',
      preview_image_url: '/image1.png',
      average_rating: 4.5,
      rating_count: 10,
      likes_count: 20
    },
    {
      id: '2',
      name: 'Wavy Hair',
      type: 'hairstyle',
      preview_image_url: '/image2.png',
      average_rating: 5.0,
      rating_count: 5,
      likes_count: 15
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    catalogService.getPublicCatalog.mockResolvedValue(mockDesigns)
  })

  it('should render catalog grid', async () => {
    renderWithRouter(<CatalogGrid />)

    await waitFor(() => {
      expect(screen.getByText(/Catálogo Público/)).toBeInTheDocument()
    })
  })

  it('should load and display designs', async () => {
    renderWithRouter(<CatalogGrid />)

    await waitFor(() => {
      expect(screen.getByText('Pink Nails')).toBeInTheDocument()
      expect(screen.getByText('Wavy Hair')).toBeInTheDocument()
    })
  })

  it('should filter by type', async () => {
    renderWithRouter(<CatalogGrid />)

    await waitFor(() => {
      expect(screen.getByText('Tipo')).toBeInTheDocument()
    })

    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'nails' } })

    await waitFor(() => {
      expect(catalogService.getPublicCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'nails' }),
        expect.any(Number),
        expect.any(Number)
      )
    })
  })

  it('should sort by different criteria', async () => {
    renderWithRouter(<CatalogGrid />)

    await waitFor(() => {
      expect(screen.getByText('Ordenar')).toBeInTheDocument()
    })

    const sortSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(sortSelect, { target: { value: 'popular' } })

    await waitFor(() => {
      expect(catalogService.getPublicCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'popular' }),
        expect.any(Number),
        expect.any(Number)
      )
    })
  })
})
