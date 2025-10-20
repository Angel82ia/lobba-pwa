import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EquipmentRequestForm from './EquipmentRequestForm'
import * as equipmentService from '../../services/equipment'
import * as permissionService from '../../services/permission'

vi.mock('../../services/equipment')
vi.mock('../../services/permission')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('EquipmentRequestForm', () => {
  const mockEquipment = [
    {
      id: 'equip-1',
      name: 'Hair Dryer',
      category: 'hair',
      description: 'Professional hair dryer',
      status: 'available',
      is_active: true
    },
    {
      id: 'equip-2',
      name: 'Straightener',
      category: 'hair',
      description: 'Professional straightener',
      status: 'available',
      is_active: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    equipmentService.getAvailableEquipment.mockResolvedValue(mockEquipment)
    permissionService.requestEquipmentPickup.mockResolvedValue({
      permission: { id: 'perm-1' },
      token: 'test-token-123'
    })
    permissionService.requestEquipmentReturn.mockResolvedValue({
      permission: { id: 'perm-2' },
      token: 'test-token-456'
    })
  })

  it('should render equipment request form', () => {
    renderWithRouter(<EquipmentRequestForm />)
    expect(screen.getByText(/Solicitar Equipo en Préstamo/)).toBeInTheDocument()
  })

  it('should load equipment on mount', async () => {
    renderWithRouter(<EquipmentRequestForm />)

    await waitFor(() => {
      expect(equipmentService.getAvailableEquipment).toHaveBeenCalled()
      expect(screen.getByText('Hair Dryer')).toBeInTheDocument()
      expect(screen.getByText('Straightener')).toBeInTheDocument()
    })
  })

  it('should switch between pickup and return modes', async () => {
    renderWithRouter(<EquipmentRequestForm />)

    const returnButton = screen.getByText(/Devolver Equipo/)
    fireEvent.click(returnButton)

    expect(returnButton).toHaveClass('active')
  })

  it('should submit pickup request', async () => {
    renderWithRouter(<EquipmentRequestForm />)

    await waitFor(() => {
      expect(screen.getByText('Hair Dryer')).toBeInTheDocument()
    })

    const equipCard = screen.getByText('Hair Dryer').closest('div')
    fireEvent.click(equipCard)

    await waitFor(() => {
      expect(screen.getByText('Equipo seleccionado: Hair Dryer')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Escanea o ingresa el ID del dispositivo')
    fireEvent.change(input, { target: { value: 'device-123' } })

    const submitButton = screen.getByText('Solicitar Recogida')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(permissionService.requestEquipmentPickup).toHaveBeenCalledWith('device-123', 'equip-1')
      expect(screen.getByText('¡Permiso creado exitosamente!')).toBeInTheDocument()
    })
  })

  it('should submit return request', async () => {
    renderWithRouter(<EquipmentRequestForm />)

    const returnButton = screen.getByText(/Devolver Equipo/)
    fireEvent.click(returnButton)

    await waitFor(() => {
      expect(screen.getByText('Hair Dryer')).toBeInTheDocument()
    })

    const equipCard = screen.getByText('Hair Dryer').closest('div')
    fireEvent.click(equipCard)

    await waitFor(() => {
      expect(screen.getByText('Equipo seleccionado: Hair Dryer')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Escanea o ingresa el ID del dispositivo')
    fireEvent.change(input, { target: { value: 'device-123' } })

    const submitButton = screen.getByText('Solicitar Devolución')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(permissionService.requestEquipmentReturn).toHaveBeenCalledWith('device-123', 'equip-1')
    })
  })
})
