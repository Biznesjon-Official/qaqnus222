import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaleDetailPanel } from '@/app/(dashboard)/sotuvlar/_components/SaleDetailPanel'
import type { SotuvQatori } from '@/app/(dashboard)/sotuvlar/_types'

const sotuv: SotuvQatori = {
  id: 's1',
  chekRaqami: 'CHK-260416-0001',
  sana: '2026-04-16T14:30:00.000Z',
  yakuniySumma: 450_000,
  chegirma: 0,
  tolovUsuli: 'NAQD',
  holati: 'YAKUNLANGAN',
  kassir: { ism: 'Aziz Rahimov' },
  mijoz: { ism: 'Jahongir', telefon: '+998 90 123 45 67' },
  tarkiblar: [
    { tovar: { nomi: 'Qazon 65sm', birlik: 'DONA' }, miqdor: 1, birlikNarxi: 380_000, jami: 380_000 },
  ],
  nasiya: null,
}

describe('SaleDetailPanel', () => {
  it('open=false bo\'lsa render qilmaydi', () => {
    const { container } = render(
      <SaleDetailPanel open={false} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('chek raqami va kassir nomi render qilinadi', () => {
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/CHK-260416-0001/)).toBeInTheDocument()
    expect(screen.getByText('Aziz Rahimov')).toBeInTheDocument()
  })

  it("tarkiblar ro'yxati ko'rinadi", () => {
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/Qazon 65sm/)).toBeInTheDocument()
  })

  it("X tugmasi bosilganda onClose chaqiriladi", async () => {
    const onClose = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={onClose} onPrev={() => {}} onNext={() => {}} />
    )
    await userEvent.click(screen.getByLabelText('Yopish'))
    expect(onClose).toHaveBeenCalled()
  })

  it("Escape bosilganda onClose chaqiriladi", async () => {
    const onClose = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={onClose} onPrev={() => {}} onNext={() => {}} />
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it("Prev/Next tugmalar tegishli callback'larni chaqiradi", async () => {
    const onPrev = vi.fn(); const onNext = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={onPrev} onNext={onNext} />
    )
    await userEvent.click(screen.getByLabelText('Oldingi sotuv'))
    expect(onPrev).toHaveBeenCalled()
    await userEvent.click(screen.getByLabelText('Keyingi sotuv'))
    expect(onNext).toHaveBeenCalled()
  })

  it("nasiya mavjud bo'lsa nasiya bo'limi ko'rinadi", () => {
    const withNasiya: SotuvQatori = {
      ...sotuv,
      tolovUsuli: 'NASIYA',
      nasiya: { qoldiq: 200_000, muddat: '2026-05-16', holati: 'OCHIQ' },
    }
    render(
      <SaleDetailPanel open={true} sotuv={withNasiya} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/NASIYA/)).toBeInTheDocument()
    expect(screen.getByText(/Qoldiq/)).toBeInTheDocument()
  })
})
