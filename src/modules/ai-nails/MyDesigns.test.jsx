import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MyDesigns from './MyDesigns'
import * as aiService from '../../services/ai'

vi.mock('../../services/ai')

describe('MyDesigns', () => {
  const createMockDesign = (index) => ({
    id: `design-${index}`,
    title: `Design ${index}`,
    type: index % 2 === 0 ? 'nails' : 'hairstyle',
    prompt: index % 2 === 0 ? `Prompt ${index}` : null,
    output_image_url: `/image${index}.png`,
    is_favorite: index === 2
  })

  const mockDesigns = Array.from({ length: 20 }, (_, i) => createMockDesign(i + 1))
  
  const mockTwoDesigns = [
    {
      id: 'design-1',
      title: 'Pink Nails',
      type: 'nails',
      prompt: 'Pink nails with flowers',
      output_image_url: '/image1.png',
      is_favorite: false
    },
    {
      id: 'design-2',
      title: 'Hairstyle Long',
      type: 'hairstyle',
      prompt: null,
      output_image_url: '/image2.png',
      is_favorite: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    aiService.getMyDesigns.mockResolvedValue(mockTwoDesigns)
  })

  it('should render my designs page', async () => {
    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText(/Mis Diseños/)).toBeInTheDocument()
    })
  })

  it('should display design cards', async () => {
    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText('Pink Nails')).toBeInTheDocument()
      expect(screen.getByText('Hairstyle Long')).toBeInTheDocument()
    })
  })

  it('should render multiple designs', async () => {
    aiService.getMyDesigns.mockResolvedValue(mockDesigns)
    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText('Design 1')).toBeInTheDocument()
    })
  })

  it('should switch to favorites tab', async () => {
    aiService.getMyFavorites.mockResolvedValue([mockTwoDesigns[1]])

    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText(/Todos/)).toBeInTheDocument()
    })

    const favoritesTab = screen.getByText(/Favoritos/)
    fireEvent.click(favoritesTab)

    await waitFor(() => {
      expect(aiService.getMyFavorites).toHaveBeenCalled()
      expect(screen.getByText('Hairstyle Long')).toBeInTheDocument()
    })
  })

  it('should toggle favorite', async () => {
    aiService.toggleFavorite.mockResolvedValue({})
    aiService.getMyDesigns.mockResolvedValue(mockTwoDesigns)

    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText('Pink Nails')).toBeInTheDocument()
    })

    // Find favorite buttons by aria-label
    const favoriteButtons = screen.getAllByLabelText('Toggle favorite')
    fireEvent.click(favoriteButtons[0])

    await waitFor(() => {
      expect(aiService.toggleFavorite).toHaveBeenCalledWith('design-1')
    })
  })

  it('should show empty state', async () => {
    aiService.getMyDesigns.mockResolvedValue([])

    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText('No tienes diseños guardados aún')).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    aiService.getMyDesigns.mockResolvedValue(mockDesigns)
    
    render(<MyDesigns />)

    await waitFor(() => {
      expect(screen.getByText('Página 1')).toBeInTheDocument()
    })

    const nextButton = screen.getByText(/Siguiente/)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(aiService.getMyDesigns).toHaveBeenCalledWith(2, 20)
    })
  })
})
