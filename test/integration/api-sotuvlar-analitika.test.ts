/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession, clearSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/analitika/route'
import { NextRequest } from 'next/server'

// vitest-mock-extended overloaded tiplarini chetlab o'tish uchun yordamchi
const asMock = (mock: unknown) => vi.mocked(mock as ReturnType<typeof vi.fn>)

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar/analitika')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
  asMock(prismaMock.qaytarish.groupBy).mockResolvedValue([])
  asMock(prismaMock.nasiya.groupBy).mockResolvedValue([])
  asMock(prismaMock.tovar.findMany).mockResolvedValue([])
})

describe('GET /api/sotuvlar/analitika', () => {
  it('auth yo\'q -> 401', async () => {
    clearSession()
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("bo'sh davr -> 0 qiymatlar", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([])
    prismaMock.sotuv.count.mockResolvedValue(0)
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.jamiSotuv).toBe(0)
    expect(body.sotuvSoni).toBe(0)
    expect(body.ortachaChek).toBe(0)
    expect(body.jamiFoyda).toBe(0)
    expect(body.kassirlar).toEqual([])
    expect(body.mijozlar).toEqual([])
  })

  it("SHERIK to'lov usuli jamiSotuv'ga kirmaydi", async () => {
    asMock(prismaMock.sotuv.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.tolovUsuli?.not === 'SHERIK') {
        return [
          { id: '1', yakuniySumma: 500, sana: new Date('2026-04-10'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [] },
        ]
      }
      return []
    })
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(body.jamiSotuv).toBe(500)
  })

  it("BEKOR_QILINGAN sotuvlar chiqariladi", async () => {
    asMock(prismaMock.sotuv.findMany).mockImplementation(async (args: any) => {
      expect(args?.where?.holati).toBe('YAKUNLANGAN')
      return []
    })
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
  })

  it("default davr = shu oy 1-kunidan bugungacha", async () => {
    asMock(prismaMock.sotuv.findMany).mockResolvedValue([])
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })

  it("oldingiDavr juft fetch qilinadi (joriy davrga teng uzunlik)", async () => {
    asMock(prismaMock.sotuv.findMany).mockResolvedValue([])
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledTimes(2)
  })

  it("kassirlar breakdown to'g'ri aggregation qiladi", async () => {
    asMock(prismaMock.sotuv.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.sana?.gte && args.where.sana.gte.getFullYear() === 2026 && args.where.sana.gte.getMonth() === 3) {
        return [
          { id: '1', yakuniySumma: 500, sana: new Date('2026-04-10'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [], kassir: { id: 'k1', ism: 'Aziz' } },
          { id: '2', yakuniySumma: 300, sana: new Date('2026-04-11'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [], kassir: { id: 'k1', ism: 'Aziz' } },
          { id: '3', yakuniySumma: 700, sana: new Date('2026-04-12'), kassirId: 'k2', mijozId: null, tolovUsuli: 'KARTA', tarkiblar: [], kassir: { id: 'k2', ism: 'Bekzod' } },
        ]
      }
      return []
    })
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(body.kassirlar).toHaveLength(2)
    const aziz = body.kassirlar.find((k: any) => k.ism === 'Aziz')
    expect(aziz.sotuvSoni).toBe(2)
    expect(aziz.jami).toBe(800)
    const bekzod = body.kassirlar.find((k: any) => k.ism === 'Bekzod')
    expect(bekzod.sotuvSoni).toBe(1)
    expect(bekzod.jami).toBe(700)
  })

  it('jamiFoyda = (birlikNarxi - kelishNarxi) * miqdor bo\'yicha hisoblanadi', async () => {
    asMock(prismaMock.qaytarish.aggregate).mockResolvedValue({ _sum: { jamiSumma: null } })
    asMock(prismaMock.sotuvTarkibi.groupBy).mockResolvedValue([])
    asMock(prismaMock.sotuv.findMany).mockImplementation(async (args: any) => {
      if (args?.where?.sana?.gte && args.where.sana.gte.getMonth() === 3) {
        return [
          {
            id: '1',
            yakuniySumma: 1000,
            sana: new Date('2026-04-10'),
            kassirId: 'k1',
            mijozId: null,
            tolovUsuli: 'NAQD',
            chegirma: 0,
            kassir: { id: 'k1', ism: 'Aziz' },
            tarkiblar: [
              { miqdor: 2, birlikNarxi: 300, tovar: { nomi: 'A', birlik: 'DONA', kelishNarxi: 200 } },
              { miqdor: 1, birlikNarxi: 400, tovar: { nomi: 'B', birlik: 'DONA', kelishNarxi: 250 } },
            ],
          } as any,
        ] as any
      }
      return [] as any
    })

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    // Foyda: (300-200)*2 + (400-250)*1 = 200 + 150 = 350
    expect(body.jamiFoyda).toBe(350)
  })
})
