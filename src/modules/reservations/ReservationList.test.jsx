import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReservationList from './ReservationList'
import * as reservationService from '../../services/reservation'
import useStore from '../../store'

vi.mock('../../services/reservation')
vi.mock('../../store')

describe('ReservationList Component', () => {
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
    reservationService.getUserReservations.mockImplementation(() => new Promise(() => {}))
    
    render(
      <MemoryRouter>
        <ReservationList />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument()
  })

  it('should display reservations list', async () => {
    const mockReservations = [
      {
        id: '123',
        business_name: 'Test Salon',
        service_name: 'Test Service',
        start_time: '2025-10-13T10:00:00Z',
        status: 'pending',
        total_price: '50.00',
      },
    ]
    
    reservationService.getUserReservations.mockResolvedValue(mockReservations)
    
    render(
      <MemoryRouter>
        <ReservationList />
      </MemoryRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Test Salon')).toBeInTheDocument()
      expect(screen.getByText('Test Service')).toBeInTheDocument()
    })
  })
})
