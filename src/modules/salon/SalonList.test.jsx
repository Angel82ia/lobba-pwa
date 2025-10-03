import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SalonList from './SalonList'
import * as profileService from '../../services/profile'

vi.mock('../../services/profile')

const mockSalons = [
  {
    id: 1,
    businessName: 'Salon Test 1',
    city: 'Madrid',
    rating: 4.5,
    description: 'Un salón de prueba'
  },
  {
    id: 2,
    businessName: 'Salon Test 2',
    city: 'Barcelona',
    rating: 5.0,
    description: 'Otro salón de prueba'
  }
]

describe('SalonList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render salon list', async () => {
    profileService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salon Test 1')).toBeInTheDocument()
      expect(screen.getByText('Salon Test 2')).toBeInTheDocument()
    })
  })

  it('should filter salons by city', async () => {
    profileService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salon Test 1')).toBeInTheDocument()
    })

    const cityInput = screen.getByPlaceholderText('Buscar por ciudad...')
    fireEvent.change(cityInput, { target: { value: 'Madrid' } })

    await waitFor(() => {
      expect(profileService.getAllSalons).toHaveBeenCalledWith({ city: 'Madrid', category: '' })
    })
  })

  it('should show error message on fetch failure', async () => {
    profileService.getAllSalons.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
