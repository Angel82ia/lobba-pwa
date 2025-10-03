import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationSettings from './NotificationSettings'
import * as notificationService from '../../services/notification'

vi.mock('../../services/notification')

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification settings page', async () => {
    notificationService.getNotificationPreferences.mockResolvedValue({
      notifications_enabled: true,
      types_enabled: ['oferta', 'evento'],
      max_radius_km: 30,
    })

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('Configuración de Notificaciones')).toBeInTheDocument()
    })
  })

  it('should load and display preferences', async () => {
    notificationService.getNotificationPreferences.mockResolvedValue({
      notifications_enabled: true,
      types_enabled: ['oferta', 'evento'],
      max_radius_km: 30,
    })

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('30 km')).toBeInTheDocument()
    })
  })

  it('should toggle notification types', async () => {
    notificationService.getNotificationPreferences.mockResolvedValue({
      notifications_enabled: true,
      types_enabled: ['oferta', 'evento'],
      max_radius_km: 30,
    })
    notificationService.updateNotificationPreferences.mockResolvedValue({})

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('Tipos de notificaciones')).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText('Ofertas')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(checkbox.checked).toBe(false)
    })
  })

  it('should update radius value', async () => {
    notificationService.getNotificationPreferences.mockResolvedValue({
      notifications_enabled: true,
      types_enabled: ['oferta'],
      max_radius_km: 30,
    })

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('30 km')).toBeInTheDocument()
    })

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '40' } })

    await waitFor(() => {
      expect(screen.getByText('40 km')).toBeInTheDocument()
    })
  })

  it('should save preferences', async () => {
    notificationService.getNotificationPreferences.mockResolvedValue({
      notifications_enabled: true,
      types_enabled: ['oferta'],
      max_radius_km: 30,
    })
    notificationService.updateNotificationPreferences.mockResolvedValue({})

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Guardar Cambios')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(notificationService.updateNotificationPreferences).toHaveBeenCalled()
    })
  })

  it('should handle errors', async () => {
    notificationService.getNotificationPreferences.mockRejectedValue(
      new Error('Network error')
    )

    render(<NotificationSettings />)

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar preferencias/i)).toBeInTheDocument()
    })
  })
})
