import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ItemRequestForm from './ItemRequestForm'
import * as itemService from '../../services/item'
import * as permissionService from '../../services/permission'

vi.mock('../../services/item')
vi.mock('../../services/permission')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ItemRequestForm', () => {
  const mockItems = [
    {
      id: 'item-1',
      name: 'Shampoo',
      category: 'hygiene',
      description: 'Test shampoo',
      stock_quantity: 10,
      is_active: true
    },
    {
      id: 'item-2',
      name: 'Conditioner',
      category: 'hygiene',
      description: 'Test conditioner',
      stock_quantity: 5,
      is_active: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    itemService.getAllItems.mockResolvedValue(mockItems)
    itemService.checkStock.mockResolvedValue({ stock: 10 })
    permissionService.requestItemPermission.mockResolvedValue({
      permission: { id: 'perm-1' },
      token: 'test-token-123'
    })
  })

  it('should render item request form', () => {
    renderWithRouter(<ItemRequestForm />)
    expect(screen.getByText(/Solicitar Artículo Gratis/)).toBeInTheDocument()
  })

  it('should load items when button is clicked', async () => {
    renderWithRouter(<ItemRequestForm />)

    const button = screen.getByText('Ver Artículos Disponibles')
    fireEvent.click(button)

    await waitFor(() => {
      expect(itemService.getAllItems).toHaveBeenCalled()
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
      expect(screen.getByText('Conditioner')).toBeInTheDocument()
    })
  })

  it('should select an item when clicked', async () => {
    renderWithRouter(<ItemRequestForm />)

    fireEvent.click(screen.getByText('Ver Artículos Disponibles'))

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const itemCard = screen.getByText('Shampoo').closest('div')
    fireEvent.click(itemCard)

    await waitFor(() => {
      expect(itemService.checkStock).toHaveBeenCalledWith('item-1')
    })
  })

  it('should submit permission request', async () => {
    renderWithRouter(<ItemRequestForm />)

    fireEvent.click(screen.getByText('Ver Artículos Disponibles'))

    await waitFor(() => {
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })

    const itemCard = screen.getByText('Shampoo').closest('div')
    fireEvent.click(itemCard)

    await waitFor(() => {
      expect(screen.getByText('Artículo seleccionado: Shampoo')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Escanea o ingresa el ID del dispositivo')
    fireEvent.change(input, { target: { value: 'device-123' } })

    const submitButton = screen.getByText('Solicitar Permiso')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(permissionService.requestItemPermission).toHaveBeenCalledWith('device-123', 'item-1')
      expect(screen.getByText('¡Permiso creado exitosamente!')).toBeInTheDocument()
    })
  })
})
