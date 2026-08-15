import { describe, it, expect } from 'vitest'
import { formatPul, formatSum } from '@/lib/utils'

describe('formatPul', () => {
  it("UZS uchun formatSum bilan bir xil natija beradi", () => {
    // formatSum uz-UZ NumberFormat (NBSP) ishlatadi
    expect(formatPul(150000, 'UZS')).toBe(formatSum(150000))
    expect(formatPul(0, 'UZS')).toBe(formatSum(0))
    expect(formatPul(1234567, 'UZS')).toBe(formatSum(1234567))
  })

  it("USD uchun '$' prefix qo'shadi", () => {
    expect(formatPul(150, 'USD')).toBe('$150')
  })

  it('USD da decimal saqlaydi', () => {
    expect(formatPul(150.5, 'USD')).toBe('$150.5')
    expect(formatPul(150.55, 'USD')).toBe('$150.55')
  })

  it("default UZS bo'ladi (formatSum bilan mos)", () => {
    expect(formatPul(1000)).toBe(formatSum(1000))
  })

  it('string input qabul qiladi', () => {
    expect(formatPul('150000', 'UZS')).toBe(formatSum(150000))
    expect(formatPul('150', 'USD')).toBe('$150')
  })

  it("0 ni to'g'ri formatlaydi", () => {
    expect(formatPul(0, 'UZS')).toBe(formatSum(0))
    expect(formatPul(0, 'USD')).toBe('$0')
  })

  it("USD katta sonni vergul bilan formatlaydi (en-US)", () => {
    expect(formatPul(1234567.89, 'USD')).toBe('$1,234,567.89')
  })

  it("noto'g'ri string ni 0 deb hisoblaydi", () => {
    expect(formatPul('abc', 'UZS')).toBe(formatSum(0))
    expect(formatPul('abc', 'USD')).toBe('$0')
  })

  it("UZS so'm suffix bilan tugaydi", () => {
    expect(formatPul(100, 'UZS').endsWith("so'm")).toBe(true)
  })

  it("USD $ bilan boshlanadi", () => {
    expect(formatPul(100, 'USD').startsWith('$')).toBe(true)
  })
})
