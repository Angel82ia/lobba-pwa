import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BannerManagement from './BannerManagement'
import { getAllBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive } from '../../services/banner'
import useStore from '../../store'

vi.mock('../../services/banner')
vi.mock('../../store')

describe('BannerManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useStore).mockReturnValue({
      auth: {
        user: { id: 'admin-123', role: 'admin' }
      }
    })
  })

  it('should show unauthorized message for non-admin users', () => {
    vi.mocked(useStore).mockReturnValue({
      auth: {
        user: { id: 'user-123', role: 'user' }
      }
    })
    
    render(<BannerManagement />)
    
    expect(screen.getByText(/No autorizado/)).toBeInTheDocument()
  })

  it('should render banner management for admin', async () => {
    vi.mocked(getAllBanners).mockResolvedValue([])
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Banners')).toBeInTheDocument()
      expect(screen.getByText('Crear Banner')).toBeInTheDocument()
    })
  })

  it('should display list of banners', async () => {
    const mockBanners = [
      {
        id: '1',
        title: 'Test Banner',
        content: 'Test content',
        type: 'announcement',
        is_active: true,
        priority: 5,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    vi.mocked(getAllBanners).mockResolvedValue(mockBanners)
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Banner')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
      expect(screen.getByText('Anuncio')).toBeInTheDocument()
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })
  })

  it('should show banner creation form when create button clicked', async () => {
    vi.mocked(getAllBanners).mockResolvedValue([])
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Crear Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Crear Banner'))
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Banner')).toBeInTheDocument()
    })
    
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contenido/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo/)).toBeInTheDocument()
  })

  it('should create new banner', async () => {
    vi.mocked(getAllBanners)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'New Banner',
          content: 'New content',
          type: 'announcement',
          is_active: true,
          priority: 0,
          created_at: '2024-01-01T00:00:00Z'
        }
      ])
    
    vi.mocked(createBanner).mockResolvedValue({
      id: '1',
      title: 'New Banner',
      content: 'New content',
      type: 'announcement'
    })
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Crear Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Crear Banner'))
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Banner')).toBeInTheDocument()
    })
    
    const titleInput = await screen.findByLabelText(/Título/)
    const contentInput = await screen.findByLabelText(/Contenido/)
    
    fireEvent.change(titleInput, {
      target: { value: 'New Banner' }
    })
    fireEvent.change(contentInput, {
      target: { value: 'New content' }
    })
    
    fireEvent.click(screen.getByText('Crear'))
    
    await waitFor(() => {
      expect(createBanner).toHaveBeenCalledWith({
        title: 'New Banner',
        content: 'New content',
        type: 'announcement',
        imageUrl: null,
        priority: 0,
        startDate: null,
        endDate: null
      })
    })
  })

  it('should edit existing banner', async () => {
    const mockBanner = {
      id: '1',
      title: 'Existing Banner',
      content: 'Existing content',
      type: 'news',
      image_url: null,
      priority: 3,
      is_active: true,
      start_date: null,
      end_date: null,
      created_at: '2024-01-01T00:00:00Z'
    }
    
    vi.mocked(getAllBanners).mockResolvedValue([mockBanner])
    vi.mocked(updateBanner).mockResolvedValue({
      ...mockBanner,
      title: 'Updated Banner'
    })
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Existing Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTitle('Editar'))
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Banner')).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/Título/), {
      target: { value: 'Updated Banner' }
    })
    
    fireEvent.click(screen.getByText('Actualizar'))
    
    await waitFor(() => {
      expect(updateBanner).toHaveBeenCalled()
    })
  })

  it('should delete banner', async () => {
    const mockBanner = {
      id: '1',
      title: 'To Delete',
      content: 'Delete content',
      type: 'promotion',
      is_active: true,
      priority: 0,
      created_at: '2024-01-01T00:00:00Z'
    }
    
    vi.mocked(getAllBanners)
      .mockResolvedValueOnce([mockBanner])
      .mockResolvedValueOnce([])
    
    vi.mocked(deleteBanner).mockResolvedValue({})
    
    window.confirm = vi.fn(() => true)
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTitle('Eliminar'))
    
    await waitFor(() => {
      expect(deleteBanner).toHaveBeenCalledWith('1')
    })
  })

  it('should toggle banner active status', async () => {
    const mockBanner = {
      id: '1',
      title: 'Toggle Banner',
      content: 'Toggle content',
      type: 'announcement',
      is_active: true,
      priority: 0,
      created_at: '2024-01-01T00:00:00Z'
    }
    
    vi.mocked(getAllBanners)
      .mockResolvedValueOnce([mockBanner])
      .mockResolvedValueOnce([{ ...mockBanner, is_active: false }])
    
    vi.mocked(toggleBannerActive).mockResolvedValue({ ...mockBanner, is_active: false })
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Toggle Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTitle('Desactivar'))
    
    await waitFor(() => {
      expect(toggleBannerActive).toHaveBeenCalledWith('1')
    })
  })

  it('should show empty state when no banners', async () => {
    vi.mocked(getAllBanners).mockResolvedValue([])
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('No hay banners creados aún')).toBeInTheDocument()
    })
  })

  it('should handle errors when fetching banners', async () => {
    vi.mocked(getAllBanners).mockRejectedValue(new Error('API Error'))
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Error al cargar banners')).toBeInTheDocument()
    })
  })

  it('should cancel form and reset data', async () => {
    vi.mocked(getAllBanners).mockResolvedValue([])
    
    render(<BannerManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Crear Banner')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Crear Banner'))
    
    await waitFor(() => {
      expect(screen.getByText('Nuevo Banner')).toBeInTheDocument()
    })
    
    const titleInput = await screen.findByLabelText(/Título/)
    
    fireEvent.change(titleInput, {
      target: { value: 'New Banner' }
    })
    
    fireEvent.click(screen.getByText('Cancelar'))
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/Título/)).not.toBeInTheDocument()
    })
  })
})
