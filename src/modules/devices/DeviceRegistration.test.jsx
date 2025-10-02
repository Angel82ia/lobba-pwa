import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DeviceRegistration from './DeviceRegistration'
import * as apiClient from '../../services/api'
import useStore from '../../store'

vi.mock('../../services/api')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('DeviceRegistration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'device-123', role: 'device' },
      },
    })
    
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 40.4168,
            longitude: -3.7038,
          },
        })
      }),
    }
  })

  it('should render device registration form', () => {
    renderWithRouter(<DeviceRegistration />)
    
    expect(screen.getByText(/registro de equipo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/identificador del equipo/i)).toBeInTheDocument()
  })

  it('should allow selecting device capabilities', () => {
    renderWithRouter(<DeviceRegistration />)
    
    const dispenseCb = screen.getByLabelText(/dispensar/i)
    const pickupCb = screen.getByLabelText(/recogida/i)
    
    expect(dispenseCb).toBeInTheDocument()
    expect(pickupCb).toBeInTheDocument()
  })

  it('should fetch geolocation on mount', async () => {
    renderWithRouter(<DeviceRegistration />)
    
    await waitFor(() => {
      expect(global.navigator.geolocation.getCurrentPosition).toHaveBeenCalled()
    })
  })

  it('should submit device registration', async () => {
    apiClient.default.post = vi.fn().mockResolvedValue({
      data: { id: 'device-123', deviceId: 'DEV001' },
    })
    
    renderWithRouter(<DeviceRegistration />)
    
    const deviceIdInput = screen.getByLabelText(/identificador del equipo/i)
    fireEvent.change(deviceIdInput, { target: { value: 'DEV001' } })
    
    const dispenseCb = screen.getByLabelText(/dispensar/i)
    fireEvent.click(dispenseCb)
    
    const submitButton = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(apiClient.default.post).toHaveBeenCalledWith(
        '/device',
        expect.objectContaining({
          deviceId: 'DEV001',
          capabilities: expect.arrayContaining(['dispense']),
        })
      )
    })
  })

  it('should display success message after registration', async () => {
    apiClient.default.post = vi.fn().mockResolvedValue({
      data: { id: 'device-123', deviceId: 'DEV001' },
    })
    
    renderWithRouter(<DeviceRegistration />)
    
    const deviceIdInput = screen.getByLabelText(/identificador del equipo/i)
    fireEvent.change(deviceIdInput, { target: { value: 'DEV001' } })
    
    const submitButton = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/equipo registrado exitosamente/i)).toBeInTheDocument()
    })
  })

  it('should display error message when registration fails', async () => {
    apiClient.default.post = vi.fn().mockRejectedValue(new Error('Registration failed'))
    
    renderWithRouter(<DeviceRegistration />)
    
    const deviceIdInput = screen.getByLabelText(/identificador del equipo/i)
    fireEvent.change(deviceIdInput, { target: { value: 'DEV001' } })
    
    const submitButton = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument()
    })
  })

  it('should only allow device role to register', () => {
    useStore.mockReturnValue({
      auth: {
        isAuthenticated: true,
        user: { id: 'user-123', role: 'user' },
      },
    })
    
    renderWithRouter(<DeviceRegistration />)
    
    expect(screen.getByText(/no autorizado/i)).toBeInTheDocument()
  })
})
