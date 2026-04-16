import { describe, it, expect } from 'vitest'

describe('Test infrastructure sanity', () => {
  it('matematik ishlaydi', () => {
    expect(2 + 2).toBe(4)
  })

  it('TypeScript strict type checking ishlaydi', () => {
    const x: number = 5
    expect(typeof x).toBe('number')
  })

  it('jest-dom matchers yuklangan', () => {
    const div = document.createElement('div')
    div.textContent = 'salom'
    expect(div).toHaveTextContent('salom')
  })
})
