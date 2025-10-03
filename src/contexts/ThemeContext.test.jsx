import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

const TestComponent = () => {
  const { theme, toggleTheme, isDark } = useTheme()
  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <p data-testid="isDark">{isDark ? 'true' : 'false'}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should provide default light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('isDark').textContent).toBe('false')
  })

  it('should toggle theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const button = screen.getByText('Toggle')
    fireEvent.click(button)

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('isDark').textContent).toBe('true')

    fireEvent.click(button)
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('should persist theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const button = screen.getByText('Toggle')
    fireEvent.click(button)

    expect(localStorage.getItem('lobba-theme')).toBe('dark')
  })

  it('should load theme from localStorage', () => {
    localStorage.setItem('lobba-theme', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})
