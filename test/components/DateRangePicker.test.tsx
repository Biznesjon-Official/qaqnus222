import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from '@/app/(dashboard)/sotuvlar/_components/DateRangePicker'

describe('DateRangePicker', () => {
  it("barcha presetlarni ko'rsatadi", () => {
    render(<DateRangePicker dan="2026-04-01" gacha="2026-04-16" onChange={() => {}} />)
    expect(screen.getByText('Bugun')).toBeInTheDocument()
    expect(screen.getByText('Kecha')).toBeInTheDocument()
    expect(screen.getByText('Oxirgi 7 kun')).toBeInTheDocument()
    expect(screen.getByText('Shu oy')).toBeInTheDocument()
    expect(screen.getByText("O'tgan oy")).toBeInTheDocument()
  })

  it('preset bosilganda onChange chaqiriladi', async () => {
    const onChange = vi.fn()
    render(<DateRangePicker dan="" gacha="" onChange={onChange} />)
    await userEvent.click(screen.getByText('Bugun'))
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0]
    expect(arg.dan).toBe(arg.gacha) // bugun = boshlanish va oxir bir xil
  })

  it("custom sana input'lari bor", () => {
    render(<DateRangePicker dan="2026-04-01" gacha="2026-04-16" onChange={() => {}} />)
    const inputs = screen.getAllByLabelText(/sana/i)
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
