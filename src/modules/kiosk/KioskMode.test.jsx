import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import KioskMode from './KioskMode'
import * as permissionService from '../../services/permission'
import * as deviceEventService from '../../services/deviceEvent'

vi.mock('../../services/permission')
vi.mock('../../services/deviceEvent')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('KioskMode', () => {
  const mockValidationSuccess = {
    valid: true,
    permission: {
      id: 'perm-1',
      action_type: 'dispense',
      item_id: 'item-1'
    }
  }

  const mockValidationError = {
    valid: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('kioskDeviceId', 'device-123')
    permissionService.validatePermission.mockResolvedValue(mockValidationSuccess)
    deviceEventService.createEvent.mockResolvedValue({})
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should render kiosk mode', () => {
    renderWithRouter(<KioskMode />)

    expect(screen.getByText('🤖 LOBBA Kiosk')).toBeInTheDocument()
    expect(screen.getByText('Dispositivo: device-123')).toBeInTheDocument()
  })

  it('should validate token successfully', async () => {
    renderWithRouter(<KioskMode />)

    const input = screen.getByPlaceholderText('Token o código QR')
    fireEvent.change(input, { target: { value: 'valid-token' } })

    const validateButton = screen.getByText('Validar')
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(permissionService.validatePermission).toHaveBeenCalledWith('valid-token')
      expect(deviceEventService.createEvent).toHaveBeenCalled()
      expect(screen.getByText('¡Operación Exitosa!')).toBeInTheDocument()
    })
  })

  it('should show error for invalid token', async () => {
    permissionService.validatePermission.mockResolvedValue(mockValidationError)

    renderWithRouter(<KioskMode />)

    const input = screen.getByPlaceholderText('Token o código QR')
    fireEvent.change(input, { target: { value: 'invalid-token' } })

    const validateButton = screen.getByText('Validar')
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText('Token inválido o expirado')).toBeInTheDocument()
    })
  })

  it('should validate on enter key press', async () => {
    renderWithRouter(<KioskMode />)

    const input = screen.getByPlaceholderText('Token o código QR')
    fireEvent.change(input, { target: { value: 'valid-token' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(permissionService.validatePermission).toHaveBeenCalledWith('valid-token')
    })
  })

  it('should display permission details after success', async () => {
    renderWithRouter(<KioskMode />)

    const input = screen.getByPlaceholderText('Token o código QR')
    fireEvent.change(input, { target: { value: 'valid-token' } })

    const validateButton = screen.getByText('Validar')
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText('Acción:')).toBeInTheDocument()
      expect(screen.getByText('dispense')).toBeInTheDocument()
    })
  })
})
