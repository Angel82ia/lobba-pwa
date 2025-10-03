import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NotificationHistory from './NotificationHistory'
import * as notificationService from '../../services/notification'

vi.mock('../../services/notification')

describe('NotificationHistory', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Oferta Especial',
      body: 'Descuento del 20%',
      type: 'oferta',
      targeting_type: 'geographic',
      radius_km: 10,
      sent_count: 100,
      success_count: 95,
      failure_count: 5,
      status: 'sent',
      created_at: '2025-10-01T10:00:00Z',
    },
    {
      id: '2',
      title: 'Nuevo Evento',
      body: 'Inauguración próxima',
      type: 'evento',
      targeting_type: 'own_clients',
      sent_count: 50,
      success_count: 48,
      failure_count: 2,
      status: 'sent',
      created_at: '2025-10-02T15:30:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render notification history', async () => {
    notificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.getByText('Historial de Notificaciones')).toBeInTheDocument()
    })
  })

  it('should display notification items', async () => {
    notificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.getByText('Oferta Especial')).toBeInTheDocument()
      expect(screen.getByText('Descuento del 20%')).toBeInTheDocument()
      expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
    })
  })

  it('should show empty state when no notifications', async () => {
    notificationService.getNotificationHistory.mockResolvedValue([])

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.getByText('No hay notificaciones enviadas aún')).toBeInTheDocument()
    })
  })

  it('should display notification stats', async () => {
    notificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('should show status badges', async () => {
    notificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      const sentBadges = screen.getAllByText('Enviada')
      expect(sentBadges.length).toBe(2)
    })
  })

  it('should paginate results', async () => {
    notificationService.getNotificationHistory.mockResolvedValue(mockNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.getByText('Siguiente')).toBeInTheDocument()
      expect(screen.getByText('Anterior')).toBeInTheDocument()
    })
  })

  it('should handle pagination click', async () => {
    const manyNotifications = Array.from({ length: 20 }, (_, i) => ({
      id: `notif-${i}`,
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

    notificationService.getNotificationHistory.mockResolvedValue(manyNotifications)

    render(<NotificationHistory />)

    await waitFor(() => {
      const nextButton = screen.getByText('Siguiente')
      expect(nextButton).not.toBeDisabled()
    })

    const nextButton = screen.getByText('Siguiente')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(2, 20)
    })
  })

  it('should handle error loading history', async () => {
    notificationService.getNotificationHistory.mockRejectedValue({
      response: { data: { message: 'Error al cargar historial' } }
    })

    render(<NotificationHistory />)

    await waitFor(() => {
      expect(screen.queryByText('Cargando historial...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Error al cargar historial')).toBeInTheDocument()
  })
})
