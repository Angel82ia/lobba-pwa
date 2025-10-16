import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SalonList from './SalonList'
import * as salonService from '../../services/salon'

vi.mock('../../services/salon')

vi.mock('./SalonMap', () => ({
  default: ({ salons }) => (
    <div data-testid="salon-map">Mapa con {salons.length} salones</div>
  )
}))

vi.mock('../../hooks/useGeolocation', () => ({
  default: () => ({
    location: { latitude: 40.416775, longitude: -3.703790 },
    error: null,
    loading: false
  })
}))

const mockSalons = [
  {
    id: 1,
    businessName: 'Salón Elegante',
    city: 'Madrid',
    rating: 4.5,
    description: 'Un salón de belleza elegante con los mejores profesionales',
    location: { latitude: 40.416775, longitude: -3.703790 }
  },
  {
    id: 2,
    businessName: 'Beauty Center',
    city: 'Barcelona',
    rating: 5.0,
    description: 'Centro de belleza especializado en tratamientos faciales',
    location: { latitude: 41.385064, longitude: 2.173404 }
  }
]

describe('SalonList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    salonService.getAllSalons.mockResolvedValue(mockSalons)
    salonService.getSalonsNearby.mockResolvedValue({ salons: mockSalons })
  })

  it('should show loading state initially', () => {
    salonService.getAllSalons.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    expect(screen.getByText('Cargando salones...')).toBeInTheDocument()
  })

  it('should render salon list after loading', async () => {
    salonService.getAllSalons.mockResolvedValueOnce(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
      expect(screen.getByText('Beauty Center')).toBeInTheDocument()
    })

    expect(screen.getByText('Madrid')).toBeInTheDocument()
    expect(screen.getByText('Barcelona')).toBeInTheDocument()
  })

  it('should display error message on fetch failure', async () => {
    salonService.getAllSalons.mockRejectedValue(new Error('Error de red'))

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Error de red')).toBeInTheDocument()
    })
  })

  it('should display empty state when no salons found', async () => {
    salonService.getAllSalons.mockResolvedValue([])

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No se encontraron salones')).toBeInTheDocument()
    })
  })

  it('should filter salons by city', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    const cityInput = screen.getByPlaceholderText('Buscar por ciudad...')
    fireEvent.change(cityInput, { target: { value: 'Madrid' } })

    await waitFor(() => {
      expect(salonService.getAllSalons).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Madrid', category: '' }),
        expect.any(Object)
      )
    })
  })

  it('should filter salons by category', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: 'hair' } })

    await waitFor(() => {
      expect(salonService.getAllSalons).toHaveBeenCalledWith(
        expect.objectContaining({ city: '', category: 'hair' }),
        expect.any(Object)
      )
    })
  })

  it('should switch to map view', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('salon-map')).not.toBeInTheDocument()

    const mapButton = screen.getByRole('button', { name: /🗺️ Mapa/i })
    fireEvent.click(mapButton)
    await waitFor(() => {
      expect(screen.getByTestId('salon-map')).toBeInTheDocument()
      expect(screen.getByText('Mapa con 2 salones')).toBeInTheDocument()
    })
  })

  it('should switch back to list view from map', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    const mapButton = screen.getByRole('button', { name: /🗺️ Mapa/i })
    fireEvent.click(mapButton)

    await waitFor(() => {
      expect(screen.getByTestId('salon-map')).toBeInTheDocument()
    })

    const listButton = screen.getByRole('button', { name: /📋 Lista/i })
    fireEvent.click(listButton)

    await waitFor(() => {
      expect(screen.queryByTestId('salon-map')).not.toBeInTheDocument()
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })
  })

  it('should enable nearby search when checkbox is clicked', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)
    salonService.getSalonsNearby.mockResolvedValue({ salons: mockSalons })

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    const nearbyCheckbox = screen.getByRole('checkbox', { name: /Buscar cerca de mi ubicación/i })
    fireEvent.click(nearbyCheckbox)

    await waitFor(() => {
      expect(salonService.getSalonsNearby).toHaveBeenCalledWith(
        40.416775,
        -3.703790,
        5,
        expect.any(Object)
      )
    })
  })

  it('should show radius control when nearby search is enabled', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)
    salonService.getSalonsNearby.mockResolvedValue({ salons: mockSalons })

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Radio:/)).not.toBeInTheDocument()

    const nearbyCheckbox = screen.getByRole('checkbox', { name: /Buscar cerca de mi ubicación/i })
    fireEvent.click(nearbyCheckbox)
    await waitFor(() => {
      expect(screen.getByText('Radio: 5 km')).toBeInTheDocument()
    })
  })

  it('should hide city and category filters when nearby search is enabled', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)
    salonService.getSalonsNearby.mockResolvedValue({ salons: mockSalons })

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Salón Elegante')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Buscar por ciudad...')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()

    const nearbyCheckbox = screen.getByRole('checkbox', { name: /Buscar cerca de mi ubicación/i })
    fireEvent.click(nearbyCheckbox)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Buscar por ciudad...')).not.toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })

  it('should display salon ratings', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('5.0')).toBeInTheDocument()
    })
  })

  it('should call getAllSalons with signal parameter', async () => {
    salonService.getAllSalons.mockResolvedValue(mockSalons)

    render(
      <BrowserRouter>
        <SalonList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(salonService.getAllSalons).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ aborted: false })
      )
    })
  })
})

