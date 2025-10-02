import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ReservationCalendar from './ReservationCalendar'
import * as reservationService from '../../services/reservation'
import * as profileService from '../../services/profile'
import useStore from '../../store'

vi.mock('../../services/reservation')
vi.mock('../../services/profile')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter initialEntries={['/reservations/new/salon-123']}>
      <Routes>
        <Route path="/reservations/new/:salonId" element={component} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReservationCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123' },
      },
    })
  })

  it('should render loading state initially', () => {
    profileService.getSalonProfile.mockImplementation(() => new Promise(() => {}))
    profileService.getSalonServices.mockImplementation(() => new Promise(() => {}))
    
    renderWithRouter(<ReservationCalendar />)
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('should display salon and services', async () => {
    const mockSalon = { id: 'salon-123', businessName: 'Test Salon' }
    const mockServices = [{ id: 'service-1', name: 'Test Service', price: 50, durationMinutes: 30 }]
    
    profileService.getSalonProfile.mockResolvedValue(mockSalon)
    profileService.getSalonServices.mockResolvedValue(mockServices)
    reservationService.getAvailableSlots.mockResolvedValue([])
    
    renderWithRouter(<ReservationCalendar />)
    
    await waitFor(() => {
      expect(screen.getByText(/test salon/i)).toBeInTheDocument()
      expect(screen.getByText(/test service/i)).toBeInTheDocument()
    })
  })
})
