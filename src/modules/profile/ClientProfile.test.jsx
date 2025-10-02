import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ClientProfile from './ClientProfile'
import * as profileService from '../../services/profile'
import useStore from '../../store'

vi.mock('../../services/profile')
vi.mock('../../store')

const renderWithRouter = (component, initialEntries = ['/profile']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/profile" element={component} />
        <Route path="/profile/:id" element={component} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClientProfile Component', () => {
  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    membershipActive: true,
    membershipStatus: 'active',
    createdAt: '2024-01-01T00:00:00Z',
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

  it('should render loading state initially', () => {
    profileService.getClientProfile.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<ClientProfile />)
    
    expect(screen.getByText(/cargando perfil/i)).toBeInTheDocument()
  })

  it('should fetch and display client profile', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<ClientProfile />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Test bio')).toBeInTheDocument()
    expect(screen.getByText(/socia activa/i)).toBeInTheDocument()
  })

  it('should display error when profile fetch fails', async () => {
    profileService.getClientProfile.mockRejectedValue(new Error('Failed to fetch'))
    
    renderWithRouter(<ClientProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('should show edit button for own profile', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<ClientProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/editar perfil/i)).toBeInTheDocument()
    })
  })

  it('should not show edit button for other users profile', async () => {
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'different-user-123', role: 'user' },
      },
    })
    
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<ClientProfile />, ['/profile/user-123'])
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    expect(screen.queryByText(/editar perfil/i)).not.toBeInTheDocument()
  })

  it('should display avatar if present', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<ClientProfile />)
    
    await waitFor(() => {
      const avatar = screen.getByAltText('John Doe')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })
  })

  it('should display member since date', async () => {
    profileService.getClientProfile.mockResolvedValue(mockProfile)
    
    renderWithRouter(<ClientProfile />)
    
    await waitFor(() => {
      expect(screen.getByText(/miembro desde/i)).toBeInTheDocument()
    })
  })
})
