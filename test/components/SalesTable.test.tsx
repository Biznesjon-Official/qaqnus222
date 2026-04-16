import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SalesTable } from '@/app/(dashboard)/sotuvlar/_components/SalesTable'
import type { SotuvQatori } from '@/app/(dashboard)/sotuvlar/_types'

const rows: SotuvQatori[] = [
  {
    id: 's1',
    chekRaqami: 'CHK-260416-0001',
    sana: '2026-04-16T14:30:00.000Z',
    yakuniySumma: 450_000,
    chegirma: 0,
    tolovUsuli: 'NAQD',
    holati: 'YAKUNLANGAN',
    kassir: { ism: 'Aziz' },
    mijoz: { ism: 'Jahongir', telefon: '+998 90 123 45 67' },
    tarkiblar: [],
    nasiya: null,
  },
  {
    id: 's2',
    chekRaqami: 'CHK-260416-0002',
    sana: '2026-04-16T13:00:00.000Z',
    yakuniySumma: 120_000,
    chegirma: 0,
    tolovUsuli: 'KARTA',
    holati: 'YAKUNLANGAN',
    kassir: { ism: 'Aziz' },
    mijoz: null,
    tarkiblar: [],
    nasiya: null,
  },
]

describe('SalesTable', () => {
  it('qatorlarni render qiladi', () => {
    render(
      <SalesTable
        rows={rows}
        jami={2}
        page={1}
        limit={50}
        sort="sana"
        order="desc"
        onRowClick={() => {}}
        onSortChange={() => {}}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText('CHK-260416-0001')).toBeInTheDocument()
    expect(screen.getByText('CHK-260416-0002')).toBeInTheDocument()
    expect(screen.getByText('Jahongir')).toBeInTheDocument()
  })

  it("mijoz null bo'lsa — ko'rsatadi", () => {
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={() => {}} onPageChange={() => {}} />
    )
    const mijozless = screen.getByText('CHK-260416-0002').closest('tr')
    expect(mijozless?.textContent).toContain('—')
  })

  it('qatorga bosilganda onRowClick chaqiriladi', async () => {
    const onRowClick = vi.fn()
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={onRowClick} onSortChange={() => {}} onPageChange={() => {}} />
    )
    await userEvent.click(screen.getByText('CHK-260416-0001'))
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
  })

  it("Sana ustunini bosganda onSortChange('sana') chaqiriladi", async () => {
    const onSortChange = vi.fn()
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={onSortChange} onPageChange={() => {}} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Sana/i }))
    expect(onSortChange).toHaveBeenCalledWith('sana')
  })

  it('pagination yuqoridan keyingi sahifaga o\'tadi', async () => {
    const onPageChange = vi.fn()
    render(
      <SalesTable rows={rows} jami={200} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={() => {}} onPageChange={onPageChange} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Keyingi/i }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
