import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant class', () => {
    const { container } = render(<Button variant="secondary">Button</Button>)
    expect(container.querySelector('.btn-secondary')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>)
    expect(screen.getByText('Button')).toBeDisabled()
  })

  it('shows loading state', () => {
    const { container } = render(<Button loading>Button</Button>)
    expect(container.querySelector('.btn-spinner')).toBeInTheDocument()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Button</Button>)
    
    fireEvent.click(screen.getByText('Button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
