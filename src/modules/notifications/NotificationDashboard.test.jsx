import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationDashboard from './NotificationDashboard'
import * as notificationService from '../../services/notification'

vi.mock('../../services/notification')

describe('NotificationDashboard', () => {
  const mockNotifications = [
    {
      id: '1',
      salon_name: 'Salón Belleza',
      title: 'Oferta Especial',
      type: 'oferta',
      targeting_type: 'geographic',
      radius_km: 15,
      sent_count: 200,
      success_count: 190,
      failure_count: 10,
      status: 'sent',
      created_at: '2025-10-01T10:00:00Z',
    },
    {
      id: '2',
      salon_name: 'Estética Premium',
      title: 'Nuevo Servicio',
      type: 'noticia',
      targeting_type: 'own_clients',
      sent_count: 80,
      success_count: 75,
      failure_count: 5,
      status: 'sent',
      created_at: '2025-10-02T14:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification dashboard', async () => {
    notificationService.getAllNotifications.mockResolvedValue(mockNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard de Notificaciones')).toBeInTheDocument()
    })
  })

  it('should display notifications table', async () => {
    notificationService.getAllNotifications.mockResolvedValue(mockNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Salón')).toBeInTheDocument()
      expect(screen.getByText('Título')).toBeInTheDocument()
      expect(screen.getByText('Tipo')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
    })
  })

  it('should display notification data', async () => {
    notificationService.getAllNotifications.mockResolvedValue(mockNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Salón Belleza')).toBeInTheDocument()
      expect(screen.getByText('Oferta Especial')).toBeInTheDocument()
      expect(screen.getByText('Estética Premium')).toBeInTheDocument()
      expect(screen.getByText('Nuevo Servicio')).toBeInTheDocument()
    })
  })

  it('should show empty state when no notifications', async () => {
    notificationService.getAllNotifications.mockResolvedValue([])

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No hay notificaciones registradas')).toBeInTheDocument()
    })
  })

  it('should display notification stats', async () => {
    notificationService.getAllNotifications.mockResolvedValue(mockNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument()
      expect(screen.getByText('190')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('should show targeting information', async () => {
    notificationService.getAllNotifications.mockResolvedValue(mockNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Geográfico (15km)')).toBeInTheDocument()
      expect(screen.getByText('Clientes propios')).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
      id: `notif-${i}`,
      salon_name: `Salon ${i}`,
      title: `Notification ${i}`,
      body: 'Test body',
      type: 'oferta',
      targeting_type: 'geographic',
      radius_km: 10,
      sent_count: 10,
      success_count: 9,
      failure_count: 1,
      status: 'sent',
      created_at: '2025-10-01T10:00:00Z',
    }))

    notificationService.getAllNotifications.mockResolvedValue(manyNotifications)

    render(<NotificationDashboard />)

    await waitFor(() => {
      const nextButton = screen.getByText('Siguiente')
      expect(nextButton).not.toBeDisabled()
    })

    const nextButton = screen.getByText('Siguiente')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(notificationService.getAllNotifications).toHaveBeenCalledWith(2, 50)
    })
  })

  it('should handle error loading dashboard', async () => {
    notificationService.getAllNotifications.mockRejectedValue({
      response: { data: { message: 'Error al cargar notificaciones' } }
    })

    render(<NotificationDashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Cargando notificaciones...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Error al cargar notificaciones')).toBeInTheDocument()
  })
})
