import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BreakdownTabs } from '@/app/(dashboard)/sotuvlar/_components/BreakdownTabs'
import type { AnalitikaJavobi } from '@/app/(dashboard)/sotuvlar/_types'

const data: AnalitikaJavobi = {
  jamiSotuv: 0, jamiQaytarish: 0, sotuvSoni: 0, ortachaChek: 0, jamiFoyda: 0, jamiChegirma: 0,
  oldingiDavr: { jamiSotuv: 0, sotuvSoni: 0, ortachaChek: 0, jamiFoyda: 0 },
  kunlikGrafik: [],
  kassirlar: [
    { kassirId: 'k1', ism: 'Aziz', sotuvSoni: 10, jami: 1_000_000, ortachaChek: 100_000, foyda: 300_000, qaytarishlarSoni: 0 },
  ],
  mijozlar: [
    { mijozId: 'm1', ism: 'Jahongir', telefon: '+998 90 123 45 67', sotuvSoni: 3, jami: 500_000, nasiyaQoldiq: 0 },
  ],
  tolovUsullari: [
    { tolovUsuli: 'NAQD', sotuvSoni: 10, jami: 1_000_000, ulush: 50 },
  ],
  topTovarlar: [
    { tovarId: 't1', nomi: 'Qazon', birlik: 'DONA', miqdor: 5, jami: 500_000, foyda: 100_000 },
  ],
  soatlar: Array.from({ length: 24 }, (_, i) => ({ soat: i, sotuvSoni: i === 14 ? 5 : 0, jami: i === 14 ? 700_000 : 0 })),
}

describe('BreakdownTabs', () => {
  it("5 ta tabni ko'rsatadi", () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    expect(screen.getByRole('tab', { name: /Kassirlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Mijozlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /To'lov/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tovarlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Soatlar/i })).toBeInTheDocument()
  })

  it("default tab = Kassirlar bo'lib, kassir ismi ko'rinadi", () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    expect(screen.getByText('Aziz')).toBeInTheDocument()
  })

  it("Mijozlar tabiga o'tish mijoz ma'lumotini ko'rsatadi", async () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    await userEvent.click(screen.getByRole('tab', { name: /Mijozlar/i }))
    expect(screen.getByText('Jahongir')).toBeInTheDocument()
  })

  it("Soatlar tabida peak soat (14) ta'kidlanadi", async () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    await userEvent.click(screen.getByRole('tab', { name: /Soatlar/i }))
    expect(screen.getByText(/14:00/)).toBeInTheDocument()
  })
})
