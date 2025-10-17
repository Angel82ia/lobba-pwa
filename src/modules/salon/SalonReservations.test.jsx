import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SalonReservations from './SalonReservations'
import * as reservationService from '../../services/reservation'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ salonId: 'test-salon-id' }),
  }
})

vi.mock('../../services/reservation', () => ({
  getSalonReservations: vi.fn(),
  confirmReservation: vi.fn(),
  rejectReservation: vi.fn(),
  completeReservation: vi.fn(),
}))

const mockReservations = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    client_phone: '+34123456789',
    service_name: 'Haircut',
    start_time: new Date('2025-10-20T10:00:00').toISOString(),
    status: 'pending',
    total_price: 25,
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    service_name: 'Manicure',
    start_time: new Date('2025-10-21T14:00:00').toISOString(),
    status: 'confirmed',
    total_price: 30,
  },
]

describe('SalonReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SalonReservations />
      </BrowserRouter>
    )
  }

  it('should render loading state initially', () => {
    reservationService.getSalonReservations.mockReturnValue(new Promise(() => {}))
    renderComponent()
    expect(screen.getByText(/Cargando reservas/i)).toBeInTheDocument()
  })

  it('should render reservations after loading', async () => {
    reservationService.getSalonReservations.mockResolvedValue(mockReservations)
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should display error message when fetch fails', async () => {
    reservationService.getSalonReservations.mockRejectedValue(new Error('Failed to fetch'))
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument()
    })
  })

  it('should filter reservations by status', async () => {
    reservationService.getSalonReservations.mockResolvedValue(mockReservations)
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const pendingButton = screen.getByText('Pendientes')
    fireEvent.click(pendingButton)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('should show confirm and reject buttons for pending reservations', async () => {
    reservationService.getSalonReservations.mockResolvedValue(mockReservations)
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const confirmButtons = screen.getAllByText(/Confirmar/i)
    const rejectButtons = screen.getAllByText(/Rechazar/i)
    
    expect(confirmButtons.length).toBeGreaterThan(0)
    expect(rejectButtons.length).toBeGreaterThan(0)
  })

  it('should call confirmReservation when confirm button is clicked', async () => {
    reservationService.getSalonReservations.mockResolvedValue(mockReservations)
    reservationService.confirmReservation.mockResolvedValue({})
    
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const confirmButton = screen.getAllByText(/✓ Confirmar/i)[0]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(reservationService.confirmReservation).toHaveBeenCalledWith('1')
    })
  })

  it('should display empty state when no reservations', async () => {
    reservationService.getSalonReservations.mockResolvedValue([])
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/No hay reservas/i)).toBeInTheDocument()
    })
  })

  it('should show reservation details correctly', async () => {
    reservationService.getSalonReservations.mockResolvedValue(mockReservations)
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Haircut')).toBeInTheDocument()
      expect(screen.getByText('25€')).toBeInTheDocument()
      expect(screen.getByText(/\+34123456789/i)).toBeInTheDocument()
    })
  })
})
