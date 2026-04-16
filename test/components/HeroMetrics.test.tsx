import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroMetrics } from '@/app/(dashboard)/sotuvlar/_components/HeroMetrics'

const data = {
  jamiSotuv: 47_250_000,
  sotuvSoni: 234,
  ortachaChek: 202_000,
  jamiFoyda: 12_400_000,
  oldingiDavr: {
    jamiSotuv: 40_000_000,
    sotuvSoni: 210,
    ortachaChek: 208_000,
    jamiFoyda: 10_000_000,
  },
  kunlikGrafik: Array.from({ length: 14 }, (_, i) => ({ sana: `2026-04-0${i}`, sotuv: i * 100 })),
}

describe('HeroMetrics', () => {
  it('hero sotuv qiymatini formatlangan ko\'rsatadi', () => {
    render(<HeroMetrics {...data} />)
    expect(screen.getByText(/47[\s,]?250[\s,]?000 so'm/)).toBeInTheDocument()
  })

  it("ijobiy taqqoslashda ▲ va yashil rang", () => {
    const { container } = render(<HeroMetrics {...data} />)
    const plus = container.querySelector('[data-testid="jamiSotuv-trend"]')
    expect(plus?.textContent).toContain('+18.1')
    expect(plus?.className).toContain('text-green')
  })

  it("salbiy taqqoslashda ▼ va qizil rang", () => {
    const salbiy = { ...data, jamiSotuv: 30_000_000 }
    const { container } = render(<HeroMetrics {...salbiy} />)
    const trend = container.querySelector('[data-testid="jamiSotuv-trend"]')
    expect(trend?.textContent).toContain('▼')
    expect(trend?.className).toContain('text-red')
  })

  it('sotuvlar soni kartasi ko\'rinadi', () => {
    render(<HeroMetrics {...data} />)
    expect(screen.getByText('Sotuvlar')).toBeInTheDocument()
    expect(screen.getByText('234 ta')).toBeInTheDocument()
  })

  it("eski = 0 bo'lsa taqqoslash ko'rsatilmaydi (null holat)", () => {
    const nolEski = { ...data, oldingiDavr: { ...data.oldingiDavr, jamiSotuv: 0 } }
    const { container } = render(<HeroMetrics {...nolEski} />)
    const trend = container.querySelector('[data-testid="jamiSotuv-trend"]')
    expect(trend?.textContent).not.toContain('+')
  })
})
