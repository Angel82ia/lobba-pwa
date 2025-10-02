import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import RegisterForm from './RegisterForm'
import * as authService from '../../services/auth'

vi.mock('../../services/auth')
vi.mock('../../store', () => ({
  default: () => ({
    setUser: vi.fn(),
    setToken: vi.fn(),
  }),
}))

describe('RegisterForm', () => {
  it('renders registration form', () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Crear Cuenta')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('submits form with user data', async () => {
    authService.register.mockResolvedValue({ id: '1', email: 'new@example.com' })
    
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    )
    
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test' },
    })
    fireEvent.change(screen.getByLabelText(/apellido/i), {
      target: { value: 'User' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'SecurePass123!' },
    })
    
    fireEvent.click(screen.getByText('Registrarse'))
    
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled()
    })
  })
})
