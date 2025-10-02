import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SalonProfile from './SalonProfile'
import * as profileService from '../../services/profile'
import useStore from '../../store'

vi.mock('../../services/profile')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('SalonProfile Component', () => {
  const mockSalon = {
    id: 'salon-123',
    userId: 'owner-123',
    businessName: 'Belleza Salon',
    description: 'Best salon in town',
    address: 'Calle Mayor 1',
    city: 'Madrid',
    phone: '+34 123 456 789',
    website: 'https://bellezasalon.com',
    rating: 4.5,
    totalReviews: 25,
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      sunday: null,
    },
    categories: [
      { id: 'cat-1', name: 'Belleza' },
      { id: 'cat-2', name: 'Peluquería' },
    ],
    gallery: [
      { id: 'img-1', cloudinaryUrl: 'https://cloudinary.com/img1.jpg' },
    ],
  }

  const mockServices = [
    {
      id: 'svc-1',
      name: 'Corte de Pelo',
      description: 'Corte profesional',
      price: 25,
      durationMinutes: 30,
      discountPercentage: 0,
    },
    {
      id: 'svc-2',
      name: 'Tinte',
      description: 'Tinte completo',
      price: 75,
      durationMinutes: 90,
      discountPercentage: 10,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', role: 'user' },
      },
    })
  })

  it('should render loading state initially', () => {
    profileService.getSalonProfile.mockImplementation(() => new Promise(() => {}))
    profileService.getSalonServices.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<SalonProfile />)
    
    expect(screen.getByText(/cargando salón/i)).toBeInTheDocument()
  })

  it('should fetch and display salon profile', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Belleza Salon')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Best salon in town')).toBeInTheDocument()
    expect(screen.getByText(/calle mayor 1/i)).toBeInTheDocument()
  })

  it('should display salon rating and reviews', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText(/25 reseñas/i)).toBeInTheDocument()
    })
  })

  it('should display salon services', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Corte de Pelo')).toBeInTheDocument()
      expect(screen.getByText('Tinte')).toBeInTheDocument()
    })
    
    expect(screen.getByText('25€')).toBeInTheDocument()
    expect(screen.getByText('75€')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('90 min')).toBeInTheDocument()
  })

  it('should display discount badge when service has discount', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('-10%')).toBeInTheDocument()
    })
  })

  it('should show edit button for salon owner', async () => {
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'owner-123', role: 'salon' },
      },
    })
    
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/editar perfil/i)).toBeInTheDocument()
    })
  })

  it('should not show edit button for non-owners', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Belleza Salon')).toBeInTheDocument()
    })
    
    expect(screen.queryByText(/editar perfil/i)).not.toBeInTheDocument()
  })

  it('should display business hours', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/horario/i)).toBeInTheDocument()
      expect(screen.getAllByText('09:00 - 18:00').length).toBeGreaterThan(0)
    })
  })

  it('should display categories', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('Belleza')).toBeInTheDocument()
      expect(screen.getByText('Peluquería')).toBeInTheDocument()
    })
  })

  it('should display gallery images', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    
    renderWithRouter(<SalonProfile />)
    
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })
  })
})
