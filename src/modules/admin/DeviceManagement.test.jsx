import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DeviceManagement from './DeviceManagement'
import * as equipmentService from '../../services/equipment'
import * as deviceEventService from '../../services/deviceEvent'
import useStore from '../../store'

vi.mock('../../services/equipment')
vi.mock('../../services/deviceEvent')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('DeviceManagement', () => {
  const mockDevices = [
    {
      id: 'device-1',
      name: 'Kiosk 1',
      category: 'hair',
      status: 'available',
      current_location_id: 'loc-1'
    },
    {
      id: 'device-2',
      name: 'Kiosk 2',
      category: 'nails',
      status: 'maintenance',
      current_location_id: 'loc-2'
    }
  ]

  const mockStats = {
    total_events: 100,
    success_rate: 0.95,
    error_count: 5
  }

  const mockErrors = [
    {
      id: 'error-1',
      device_id: 'device-1',
      event_type: 'dispense_error',
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: { user: { id: 'admin-1', role: 'admin' } }
    })
    equipmentService.getAllEquipment.mockResolvedValue(mockDevices)
    deviceEventService.getDeviceStats.mockResolvedValue(mockStats)
    deviceEventService.getRecentErrors.mockResolvedValue(mockErrors)
    equipmentService.updateEquipmentStatus.mockResolvedValue({})
  })

  it('should render device management', async () => {
    renderWithRouter(<DeviceManagement />)

    await waitFor(() => {
      expect(screen.getByText('Gestión de Dispositivos Remotos')).toBeInTheDocument()
    })
  })

  it('should block non-admin users', () => {
    useStore.mockReturnValue({
      auth: { user: { id: 'user-1', role: 'user' } }
    })

    renderWithRouter(<DeviceManagement />)

    expect(screen.getByText(/No autorizado/i)).toBeInTheDocument()
  })

  it('should load and display devices', async () => {
    renderWithRouter(<DeviceManagement />)

    await waitFor(() => {
      expect(equipmentService.getAllEquipment).toHaveBeenCalled()
      expect(screen.getByText('Kiosk 1')).toBeInTheDocument()
      expect(screen.getByText('Kiosk 2')).toBeInTheDocument()
    })
  })

  it('should show device stats when selected', async () => {
    renderWithRouter(<DeviceManagement />)

    await waitFor(() => {
      expect(screen.getByText('Kiosk 1')).toBeInTheDocument()
    })

    const deviceCard = screen.getByText('Kiosk 1').closest('.device-card')
    fireEvent.click(deviceCard)

    await waitFor(() => {
      expect(deviceEventService.getDeviceStats).toHaveBeenCalledWith('device-1', 7)
      expect(screen.getByText('Estadísticas (últimos 7 días)')).toBeInTheDocument()
    })
  })

  it('should update device status', async () => {
    renderWithRouter(<DeviceManagement />)

    await waitFor(() => {
      expect(screen.getByText('Kiosk 1')).toBeInTheDocument()
    })

    const deviceCard = screen.getByText('Kiosk 1').closest('.device-card')
    fireEvent.click(deviceCard)

    await waitFor(() => {
      expect(screen.getByText('Marcar Disponible')).toBeInTheDocument()
    })

    const availableButton = screen.getByText('Marcar Disponible')
    fireEvent.click(availableButton)

    await waitFor(() => {
      expect(equipmentService.updateEquipmentStatus).toHaveBeenCalledWith('device-1', 'available')
    })
  })
})
