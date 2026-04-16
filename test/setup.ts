import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Har testdan keyin DOM ni tozalash
afterEach(() => {
  cleanup()
})

// NextAuth session mock (ko'pchilik test'larda foydalidir)
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@test.uz',
      rol: 'ADMIN',
    },
  })),
}))

// matchMedia (jsdom'da yo'q, ba'zi komponentlar uchun kerak)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// IntersectionObserver (jsdom'da yo'q, Radix UI uchun kerak)
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds = []
}
;(window as unknown as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver

// ResizeObserver (jsdom'da yo'q, Recharts uchun kerak)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(window as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver
