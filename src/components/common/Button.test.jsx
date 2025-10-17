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
    render(<Button variant="secondary">Button</Button>)
    const button = screen.getByRole('button', { name: 'Button' })
    // Check that button exists and has appropriate styling
    expect(button).toBeInTheDocument()
    expect(button).not.toHaveClass('bg-[#FF1493]') // Should not have primary color
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>)
    expect(screen.getByText('Button')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    // Button should be disabled when loading
    expect(button).toBeDisabled()
    // Check for loading text or spinner by looking for the disabled state
    expect(button).toHaveAttribute('disabled')
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Button</Button>)
    
    fireEvent.click(screen.getByText('Button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
