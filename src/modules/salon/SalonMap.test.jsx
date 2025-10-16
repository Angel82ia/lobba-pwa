import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SalonMap from './SalonMap'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
    getZoom: vi.fn(() => 13),
  }),
}))

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: { _getIconUrl: null },
        mergeOptions: vi.fn(),
      },
    },
  },
}))

describe('SalonMap', () => {
  const mockSalons = [
    {
      id: 'salon-uuid-1',
      businessName: 'Salon Test',
      description: 'A test salon',
      address: 'Calle Test 123',
      city: 'Madrid',
      phone: '123456789',
      location: {
        latitude: 40.416775,
        longitude: -3.703790,
      },
      distance: '2.5',
      rating: 4.5,
      totalReviews: 10,
    },
  ]

  it('renders map container when salons are provided', () => {
    render(<SalonMap salons={mockSalons} />)
    expect(screen.getByTestId('map-container')).toBeDefined()
  })

  it('shows empty state when no salons are provided', () => {
    render(<SalonMap salons={[]} />)
    expect(screen.getByText(/no hay salones disponibles/i)).toBeDefined()
  })

  it('renders markers for salons with location', () => {
    render(<SalonMap salons={mockSalons} />)
    expect(screen.getByTestId('marker')).toBeDefined()
  })

  it('displays salon information in popup', () => {
    render(<SalonMap salons={mockSalons} />)
    expect(screen.getByText('Salon Test')).toBeDefined()
    expect(screen.getByText(/calle test 123/i)).toBeDefined()
    expect(screen.getByText(/2.5 km/i)).toBeDefined()
  })

  it('handles salons without location gracefully', () => {
    const salonsWithoutLocation = [
      {
        id: 'salon-uuid-2',
        businessName: 'Salon Without Location',
        description: 'Test',
        address: 'Test Address',
        city: 'Test City',
      },
    ]
    render(<SalonMap salons={salonsWithoutLocation} />)
    expect(screen.queryByTestId('marker')).toBeNull()
  })

  it('calls onSalonClick when provided', () => {
    const mockOnClick = vi.fn()
    render(<SalonMap salons={mockSalons} onSalonClick={mockOnClick} />)
    expect(screen.getByTestId('marker')).toBeDefined()
  })
})
