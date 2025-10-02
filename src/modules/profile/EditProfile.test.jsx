import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EditProfile from './EditProfile'
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
  }
})

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('EditProfile Component', () => {
  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', role: 'user' },
      },
    })
  })

  it('should render loading state while fetching profile', () => {
    profileService.getClientProfile.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<EditProfile />)
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('should fetch and display current profile data in form', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
  })

  it('should update form fields when user types', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
    
    const firstNameInput = screen.getByLabelText(/nombre/i)
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
  })

  it('should submit form and update profile', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    profileService.updateClientProfile.mockResolvedValue({
      ...mockProfile,
      firstName: 'Jane',
    })
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
    
    const firstNameInput = screen.getByLabelText(/nombre/i)
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(profileService.updateClientProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Test bio',
        avatar: 'https://example.com/avatar.jpg',
      })
    })
  })

  it('should navigate back to profile after successful update', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    profileService.updateClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })
  })

  it('should display error message when update fails', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    profileService.updateClientProfile.mockRejectedValue(new Error('Update failed'))
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
    
    const submitButton = screen.getByRole('button', { name: /guardar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('should have cancel button that navigates back', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<EditProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    fireEvent.click(cancelButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })
})
