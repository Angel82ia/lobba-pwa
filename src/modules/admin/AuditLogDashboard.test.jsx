import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuditLogDashboard from './AuditLogDashboard'
import * as auditLogService from '../../services/auditLog'

vi.mock('../../services/auditLog')

describe('AuditLogDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auditLogService.getAuditLogs.mockResolvedValue([
      { id: '1', action: 'auth', user_email: 'user@test.com', created_at: new Date().toISOString(), ip_address: '127.0.0.1', resource_type: 'user', details: {} }
    ])
    auditLogService.getAuditStats.mockResolvedValue([
      { action: 'auth', count: '10' }
    ])
  })

  it('should render audit log dashboard', async () => {
    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Registros de Auditoría')).toBeInTheDocument()
    })
  })

  it('should load and display logs', async () => {
    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument()
      expect(screen.getByText('127.0.0.1')).toBeInTheDocument()
    })

    expect(auditLogService.getAuditLogs).toHaveBeenCalled()
  })

  it('should load and display statistics', async () => {
    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('auth')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    expect(auditLogService.getAuditStats).toHaveBeenCalled()
  })

  it('should filter logs by action', async () => {
    const user = userEvent.setup()
    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Registros de Auditoría')).toBeInTheDocument()
    })

    const actionSelect = screen.getByRole('combobox')
    await user.selectOptions(actionSelect, 'auth')

    await waitFor(() => {
      expect(auditLogService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth' })
      )
    })
  })

  it('should handle pagination', async () => {
    const user = userEvent.setup()
    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Página 1')).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Siguiente')
    await user.click(nextButton)

    await waitFor(() => {
      expect(auditLogService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      )
    })
  })

  it('should handle errors gracefully', async () => {
    auditLogService.getAuditLogs.mockRejectedValue(new Error('Network error'))

    render(<AuditLogDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Error al cargar logs de auditoría')).toBeInTheDocument()
    })
  })
})
