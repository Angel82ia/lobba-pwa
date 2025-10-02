import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import * as apiClient from '../../services/api'
import useStore from '../../store'

vi.mock('../../services/api')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AdminDashboard Component', () => {
  const mockUsers = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      membershipActive: true,
    },
    {
      id: 'user-2',
      email: 'salon@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'salon',
      membershipActive: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'admin-123', role: 'admin' },
      },
    })
  })

  it('should render admin dashboard', async () => {
    apiClient.default.get = vi.fn().mockResolvedValue({ data: [] })
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/panel de administración/i)).toBeInTheDocument()
    })
  })

  it('should fetch and display users', async () => {
    apiClient.default.get = vi.fn().mockResolvedValue({ data: mockUsers })
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      expect(screen.getByText('salon@example.com')).toBeInTheDocument()
    })
  })

  it('should filter users by role', async () => {
    apiClient.default.get = vi.fn().mockResolvedValue({ data: mockUsers })
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })
    
    const roleFilter = screen.getByLabelText(/filtrar por rol/i)
    fireEvent.change(roleFilter, { target: { value: 'salon' } })
    
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('salon@example.com')).toBeInTheDocument()
  })

  it('should search users by email', async () => {
    apiClient.default.get = vi.fn().mockResolvedValue({ data: mockUsers })
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(searchInput, { target: { value: 'salon' } })
    
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument()
    expect(screen.getByText('salon@example.com')).toBeInTheDocument()
  })

  it('should display user statistics', async () => {
    apiClient.default.get = vi.fn().mockResolvedValue({ data: mockUsers })
    
    renderWithRouter(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/total usuarios/i)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('should only allow admin role to access dashboard', () => {
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', role: 'user' },
      },
    })
    
    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByText(/no autorizado/i)).toBeInTheDocument()
  })
})
