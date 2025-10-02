import { describe, it, expect, vi } from 'vitest'
import { requireAuth, requireRole, requireMembership } from '../../src/middleware/auth.js'

describe('Auth Middleware', () => {
  it('requireAuth should reject without token', async () => {
    const req = { headers: {} }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('requireRole should allow correct role', () => {
    const req = { user: { role: 'admin' } }
    const res = {}
    const next = vi.fn()

    const middleware = requireRole('admin', 'salon')
    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('requireRole should reject incorrect role', () => {
    const req = { user: { role: 'user' } }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    const middleware = requireRole('admin')
    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('requireMembership should reject suspended membership', () => {
    const req = { user: { membership_status: 'suspended' } }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    requireMembership(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('requireMembership should allow active membership', () => {
    const req = { user: { membership_status: 'active' } }
    const res = {}
    const next = vi.fn()

    requireMembership(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
