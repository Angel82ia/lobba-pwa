import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from './LoginForm'
import * as authService from '../../services/auth'

vi.mock('../../services/auth')
vi.mock('../../store', () => ({
  default: () => ({
    setUser: vi.fn(),
    setToken: vi.fn(),
  }),
}))

describe('LoginForm', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('submits form with credentials', async () => {
    authService.login.mockResolvedValue({ id: '1', email: 'test@example.com' })
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    )
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'password123' },
    })
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})
