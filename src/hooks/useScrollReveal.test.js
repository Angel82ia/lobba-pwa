import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollReveal } from './useScrollReveal'

describe('useScrollReveal', () => {
  beforeEach(() => {
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))

    document.body.innerHTML = `
      <div class="animate-on-scroll">Element 1</div>
      <div class="animate-on-scroll">Element 2</div>
    `
  })

  it('should create IntersectionObserver', () => {
    renderHook(() => useScrollReveal())
    expect(global.IntersectionObserver).toHaveBeenCalled()
  })

  it('should observe elements with default selector', () => {
    const mockObserve = vi.fn()
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))

    renderHook(() => useScrollReveal())
    expect(mockObserve).toHaveBeenCalledTimes(2)
  })

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useScrollReveal())
    unmount()
  })
})
