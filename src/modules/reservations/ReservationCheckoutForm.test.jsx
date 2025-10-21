import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock useLocation hook first
const mockUseLocation = vi.fn()
const mockUseNavigate = vi.fn()

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  }
})

// Mock Stripe
vi.mock('@stripe/stripe-js')
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>, // eslint-disable-line react/prop-types
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => ({
    confirmCardPayment: vi.fn(),
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({})),
  }),
}))

// Import components after mocking
import ReservationCheckoutForm from './ReservationCheckoutForm'

// Mock our custom hook
vi.mock('../../hooks/useStripePayment', () => ({
  useStripePayment: () => ({
    processPayment: vi.fn(),
    processing: false,
    error: '',
    setError: vi.fn(),
    isReady: true,
  }),
}))

// Mock services
vi.mock('../../services/reservationCheckout', () => ({
  processReservationCheckout: vi.fn(),
  confirmReservationPayment: vi.fn(),
}))

// Mock components
vi.mock('../../components/common/StripeCardElement', () => ({
  default: () => <div data-testid="stripe-card-element">Mock Card Element</div>,
}))

const mockReservationData = {
  salon: {
    businessName: 'Test Salon',
  },
  service: {
    id: 'service-1',
    name: 'Test Service',
    price: 50,
    durationMinutes: 30,
  },
  selectedDate: '2024-12-25',
  selectedSlot: '10:00',
  startTime: '2024-12-25T10:00:00Z',
  endTime: '2024-12-25T10:30:00Z',
  notes: 'Test notes',
  clientPhone: '+34123456789',
}

const renderWithRouter = (component, initialEntries = ['/reservation-checkout']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  )
}

describe('ReservationCheckoutForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useLocation to return reservation data
    mockUseLocation.mockReturnValue({
      state: {
        reservationData: mockReservationData,
      },
    })
  })

  it('should render checkout form with Stripe Elements', () => {
    renderWithRouter(<ReservationCheckoutForm />)
    
    expect(screen.getByTestId('stripe-elements')).toBeInTheDocument()
    expect(screen.getByText(/confirmar y pagar reserva/i)).toBeInTheDocument()
  })

  it('should display reservation summary', async () => {
    renderWithRouter(<ReservationCheckoutForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Salon')).toBeInTheDocument()
      expect(screen.getByText('Test Service')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(screen.getByText('30 minutos')).toBeInTheDocument()
      expect(screen.getByText('50€')).toBeInTheDocument()
    })
  })

  it('should show error message when no reservation data', () => {
    // Mock useLocation to return no data
    mockUseLocation.mockReturnValue({
      state: null,
    })

    renderWithRouter(<ReservationCheckoutForm />)
    
    expect(screen.getByText(/no hay datos de reserva/i)).toBeInTheDocument()
    expect(screen.getByText(/volver a salones/i)).toBeInTheDocument()
  })

  it('should render payment form', () => {
    renderWithRouter(<ReservationCheckoutForm />)
    
    expect(screen.getByTestId('stripe-card-element')).toBeInTheDocument()
    expect(screen.getByText(/método de pago/i)).toBeInTheDocument()
  })
})
