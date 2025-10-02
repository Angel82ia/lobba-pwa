import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EditSalonProfile from './EditSalonProfile'
import * as profileService from '../../services/profile'
import useStore from '../../store'

vi.mock('../../services/profile')
vi.mock('../../store')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'salon-123' }),
  }
})

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('EditSalonProfile Component', () => {
  const mockSalon = {
    id: 'salon-123',
    userId: 'owner-123',
    businessName: 'Belleza Salon',
    description: 'Best salon in town',
    address: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28001',
    phone: '+34 123 456 789',
    website: 'https://bellezasalon.com',
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
    },
    categories: [
      { id: 'cat-1', name: 'Belleza' },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'owner-123', role: 'salon' },
      },
    })
  })

  it('should render loading state while fetching profile', () => {
    profileService.getSalonProfile.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<EditSalonProfile />)
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('should fetch and display current salon data in form', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Best salon in town')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Calle Mayor 1')).toBeInTheDocument()
    })
  })

  it('should update form fields when user types', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByLabelText(/nombre del negocio/i)
    fireEvent.change(nameInput, { target: { value: 'New Salon Name' } })
    
    expect(screen.getByDisplayValue('New Salon Name')).toBeInTheDocument()
  })

  it('should submit form and update salon profile', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.updateSalonProfile.mockResolvedValue({
      ...mockSalon,
      businessName: 'Updated Salon',
    })
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByLabelText(/nombre del negocio/i)
    fireEvent.change(nameInput, { target: { value: 'Updated Salon' } })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(profileService.updateSalonProfile).toHaveBeenCalledWith(
        'salon-123',
        expect.objectContaining({
          businessName: 'Updated Salon',
        })
      )
    })
  })

  it('should navigate back to salon profile after successful update', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.updateSalonProfile.mockResolvedValue(mockSalon)
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/salon/salon-123')
    })
  })

  it('should display error message when update fails', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.updateSalonProfile.mockRejectedValue(new Error('Update failed'))
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('should have cancel button that navigates back', async () => {
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Belleza Salon')).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    fireEvent.click(cancelButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/salon/salon-123')
  })

  it('should only allow salon owner to edit their profile', async () => {
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'different-user', role: 'user' },
      },
    })
    
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    
    renderWithRouter(<EditSalonProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/no autorizado/i)).toBeInTheDocument()
    })
  })
})
