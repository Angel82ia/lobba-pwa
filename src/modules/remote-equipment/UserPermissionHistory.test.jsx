import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UserPermissionHistory from './UserPermissionHistory'
import * as permissionService from '../../services/permission'
import * as deviceEventService from '../../services/deviceEvent'

vi.mock('../../services/permission')
vi.mock('../../services/deviceEvent')

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('UserPermissionHistory', () => {
  const mockPermissions = [
    {
      id: 'perm-1',
      permission_type: 'item',
      action_type: 'dispense',
      device_id: 'device-1',
      status: 'used',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString()
    },
    {
      id: 'perm-2',
      permission_type: 'equipment',
      action_type: 'pickup',
      device_id: 'device-2',
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }
  ]

  const mockEvents = [
    {
      id: 'event-1',
      permission_id: 'perm-1',
      event_type: 'dispense_success',
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    permissionService.getUserPermissions.mockResolvedValue(mockPermissions)
    deviceEventService.getUserEvents.mockResolvedValue(mockEvents)
  })

  it('should render permission history', async () => {
    renderWithRouter(<UserPermissionHistory />)

    await waitFor(() => {
      expect(screen.getByText('📜 Mi Historial de Permisos')).toBeInTheDocument()
    })
  })

  it('should load and display permissions', async () => {
    renderWithRouter(<UserPermissionHistory />)

    await waitFor(() => {
      expect(permissionService.getUserPermissions).toHaveBeenCalled()
      expect(deviceEventService.getUserEvents).toHaveBeenCalled()
      expect(screen.getByText('🎁 Artículo Gratis')).toBeInTheDocument()
      expect(screen.getByText('🔋 Equipo en Préstamo')).toBeInTheDocument()
    })
  })

  it('should filter permissions by status', async () => {
    renderWithRouter(<UserPermissionHistory />)

    await waitFor(() => {
      expect(screen.getByText('Pendientes')).toBeInTheDocument()
    })

    const pendingButton = screen.getByText('Pendientes')
    fireEvent.click(pendingButton)

    await waitFor(() => {
      expect(permissionService.getUserPermissions).toHaveBeenCalledWith('pending')
    })
  })

  it('should display related events', async () => {
    renderWithRouter(<UserPermissionHistory />)

    await waitFor(() => {
      expect(screen.getByText('Eventos Relacionados')).toBeInTheDocument()
      expect(screen.getByText('✅ Entrega Exitosa')).toBeInTheDocument()
    })
  })
})
