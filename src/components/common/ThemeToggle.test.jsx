import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle', () => {
  it('should render moon icon in light mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    expect(screen.getByText('🌙')).toBeInTheDocument()
  })

  it('should toggle theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(screen.getByText('🌙')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('☀️')).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByText('🌙')).toBeInTheDocument()
  })
})
