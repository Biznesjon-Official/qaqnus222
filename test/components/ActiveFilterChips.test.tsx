import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveFilterChips } from '@/app/(dashboard)/sotuvlar/_components/ActiveFilterChips'

describe('ActiveFilterChips', () => {
  it("faol filterlar chip sifatida ko'rinadi", () => {
    render(
      <ActiveFilterChips
        labels={[
          { key: 'kassir', label: 'Kassir: Aziz' },
          { key: 'tolov', label: "To'lov: NAQD" },
        ]}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    )
    expect(screen.getByText('Kassir: Aziz')).toBeInTheDocument()
    expect(screen.getByText("To'lov: NAQD")).toBeInTheDocument()
    expect(screen.getByText("Hammasini tozalash")).toBeInTheDocument()
  })

  it('chip bosilganda onRemove chaqiriladi', async () => {
    const onRemove = vi.fn()
    render(
      <ActiveFilterChips
        labels={[{ key: 'kassir', label: 'Kassir: Aziz' }]}
        onRemove={onRemove}
        onClearAll={() => {}}
      />
    )
    await userEvent.click(screen.getByLabelText("Kassir: Aziz chip'ini olib tashlash"))
    expect(onRemove).toHaveBeenCalledWith('kassir')
  })

  it("\"Hammasini tozalash\" bosilganda onClearAll chaqiriladi", async () => {
    const onClearAll = vi.fn()
    render(
      <ActiveFilterChips
        labels={[{ key: 'kassir', label: 'X' }]}
        onRemove={() => {}}
        onClearAll={onClearAll}
      />
    )
    await userEvent.click(screen.getByText('Hammasini tozalash'))
    expect(onClearAll).toHaveBeenCalled()
  })

  it("labels bo'sh bo'lsa hech narsa render qilmaydi", () => {
    const { container } = render(
      <ActiveFilterChips labels={[]} onRemove={() => {}} onClearAll={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })
})
