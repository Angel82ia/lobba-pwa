import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import InventoryManagement from './InventoryManagement'
import * as itemService from '../../services/item'
import * as equipmentService from '../../services/equipment'
import useStore from '../../store'

vi.mock('../../services/item')
vi.mock('../../services/equipment')
vi.mock('../../store')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('InventoryManagement', () => {
  const mockItems = [
    {
      id: 'item-1',
      name: 'Shampoo',
      category: 'hygiene',
      stock_quantity: 50,
      is_active: true
    }
  ]

  const mockEquipment = [
    {
      id: 'equip-1',
      name: 'Hair Dryer',
      category: 'hair',
      is_active: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useStore.mockReturnValue({
      auth: { user: { id: 'admin-1', role: 'admin' } }
    })
    itemService.getAllItems.mockResolvedValue(mockItems)
    equipmentService.getAllEquipment.mockResolvedValue(mockEquipment)
    itemService.createItem.mockResolvedValue({})
    itemService.updateItem.mockResolvedValue({})
    itemService.deleteItem.mockResolvedValue({})
    itemService.updateStock.mockResolvedValue({})
  })

  it('should render inventory management', async () => {
    renderWithRouter(<InventoryManagement />)

    await waitFor(() => {
      expect(screen.getByText('Gestión de Inventario')).toBeInTheDocument()
    })
  })

  it('should block non-admin users', () => {
    useStore.mockReturnValue({
      auth: { user: { id: 'user-1', role: 'user' } }
    })

    renderWithRouter(<InventoryManagement />)

    expect(screen.getByText(/No autorizado/i)).toBeInTheDocument()
  })

  it('should load and display items', async () => {
    renderWithRouter(<InventoryManagement />)

    await waitFor(() => {
      expect(itemService.getAllItems).toHaveBeenCalled()
      expect(screen.getByText('Shampoo')).toBeInTheDocument()
    })
  })

  it('should switch between items and equipment tabs', async () => {
    renderWithRouter(<InventoryManagement />)

    await waitFor(() => {
      expect(screen.getByText('Equipos en Préstamo')).toBeInTheDocument()
    })

    const equipmentTab = screen.getByText('Equipos en Préstamo')
    fireEvent.click(equipmentTab)

    await waitFor(() => {
      expect(equipmentService.getAllEquipment).toHaveBeenCalled()
      expect(screen.getByText('Hair Dryer')).toBeInTheDocument()
    })
  })

  it('should show create form when add button clicked', async () => {
    renderWithRouter(<InventoryManagement />)

    await waitFor(() => {
      expect(screen.getByText('+ Agregar Artículo')).toBeInTheDocument()
    })

    const addButton = screen.getByText('+ Agregar Artículo')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Nuevo Artículo')).toBeInTheDocument()
    })
  })

  it('should create new item', async () => {
    renderWithRouter(<InventoryManagement />)

    await waitFor(() => {
      expect(screen.getByText('+ Agregar Artículo')).toBeInTheDocument()
    })

    const addButton = screen.getByText('+ Agregar Artículo')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Nuevo Artículo')).toBeInTheDocument()
    })

    const inputs = screen.getAllByRole('textbox')
    const nameInput = inputs[0] // First textbox is Nombre
    fireEvent.change(nameInput, { target: { value: 'New Item' } })

    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: 'hygiene' } })

    const submitButton = screen.getByText('Guardar')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(itemService.createItem).toHaveBeenCalled()
    })
  })
})
