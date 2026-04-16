import { describe, it, expect } from 'vitest'
import {
  hisoblaFoiz,
  hisoblaOrtachaChek,
  oldingiDavrOlish,
  soatTaqsimoti,
} from '@/lib/analitika'

describe('hisoblaFoiz', () => {
  it("yangi > eski -> ijobiy foiz qaytaradi", () => {
    expect(hisoblaFoiz(120, 100)).toBe(20)
  })

  it("yangi < eski -> salbiy foiz qaytaradi", () => {
    expect(hisoblaFoiz(80, 100)).toBe(-20)
  })

  it('eski = 0 -> null qaytaradi (noaniq)', () => {
    expect(hisoblaFoiz(100, 0)).toBeNull()
  })

  it('yangi = eski -> 0 qaytaradi', () => {
    expect(hisoblaFoiz(100, 100)).toBe(0)
  })

  it('ikki kasrli yumaloqlash', () => {
    expect(hisoblaFoiz(103, 100)).toBe(3)
    expect(hisoblaFoiz(103.5, 100)).toBe(3.5)
  })
})

describe('hisoblaOrtachaChek', () => {
  it("jami / soni to'g'ri hisoblanadi", () => {
    expect(hisoblaOrtachaChek(1000, 5)).toBe(200)
  })

  it('soni = 0 -> 0 qaytaradi (nol bo\'luvidan saqlash)', () => {
    expect(hisoblaOrtachaChek(1000, 0)).toBe(0)
  })

  it('jami = 0 -> 0 qaytaradi', () => {
    expect(hisoblaOrtachaChek(0, 5)).toBe(0)
  })
})

describe('oldingiDavrOlish', () => {
  it('16 kunlik davr uchun oldingi 16 kunni qaytaradi', () => {
    const dan = new Date('2026-04-01T00:00:00')
    const gacha = new Date('2026-04-16T23:59:59')
    const natija = oldingiDavrOlish(dan, gacha)
    expect(natija.dan.toISOString().slice(0, 10)).toBe('2026-03-16')
    expect(natija.gacha.toISOString().slice(0, 10)).toBe('2026-03-31')
  })

  it('1 kunlik davr uchun oldingi kunni qaytaradi', () => {
    const dan = new Date('2026-04-16T00:00:00')
    const gacha = new Date('2026-04-16T23:59:59')
    const natija = oldingiDavrOlish(dan, gacha)
    expect(natija.dan.toISOString().slice(0, 10)).toBe('2026-04-15')
    expect(natija.gacha.toISOString().slice(0, 10)).toBe('2026-04-15')
  })
})

describe('soatTaqsimoti', () => {
  it("24 ta soat qaytaradi (0-23)", () => {
    const natija = soatTaqsimoti([])
    expect(natija).toHaveLength(24)
    expect(natija[0].soat).toBe(0)
    expect(natija[23].soat).toBe(23)
  })

  it("sotuvlarni soat bo'yicha to'g'ri guruhlaydi", () => {
    const sotuvlar = [
      { sana: new Date('2026-04-16T09:30:00'), yakuniySumma: 100 },
      { sana: new Date('2026-04-16T09:45:00'), yakuniySumma: 200 },
      { sana: new Date('2026-04-16T14:00:00'), yakuniySumma: 500 },
    ]
    const natija = soatTaqsimoti(sotuvlar)
    expect(natija[9].sotuvSoni).toBe(2)
    expect(natija[9].jami).toBe(300)
    expect(natija[14].sotuvSoni).toBe(1)
    expect(natija[14].jami).toBe(500)
    expect(natija[0].sotuvSoni).toBe(0)
  })
})
