/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
  prismaMock.sotuv.findMany.mockResolvedValue([] as any)
  prismaMock.sotuv.count.mockResolvedValue(0)
})

describe('GET /api/sotuvlar — kengaytirilgan filter\'lar', () => {
  it('kassirId filter where shartiga qo\'shiladi', async () => {
    await GET(makeRequest({ kassirId: 'k1' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ kassirId: 'k1' }) })
    )
  })

  it('mijozId filter where shartiga qo\'shiladi', async () => {
    await GET(makeRequest({ mijozId: 'm1' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ mijozId: 'm1' }) })
    )
  })

  it("tolovUsuli filter where shartiga qo'shiladi", async () => {
    await GET(makeRequest({ tolovUsuli: 'NAQD' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tolovUsuli: 'NAQD' }) })
    )
  })

  it("q parametri chekRaqami yoki mijoz.ism bo'yicha OR qidiruv", async () => {
    await GET(makeRequest({ q: 'test' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ chekRaqami: expect.objectContaining({ contains: 'test' }) }),
            expect.objectContaining({ mijoz: expect.objectContaining({ ism: expect.any(Object) }) }),
          ]),
        }),
      })
    )
  })

  it("sort va order parametrlari orderBy ga o'tkaziladi", async () => {
    await GET(makeRequest({ sort: 'yakuniySumma', order: 'asc' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { yakuniySumma: 'asc' } })
    )
  })

  it("noma'lum sort qiymati -> default sana desc", async () => {
    await GET(makeRequest({ sort: 'mavhum-ustun' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { sana: 'desc' } })
    )
  })

  it("mavjud dan/gacha filter saqlanadi", async () => {
    await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sana: expect.any(Object) }),
      })
    )
  })
})
