/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession, clearSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/export/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar/export')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
})

describe('GET /api/sotuvlar/export', () => {
  it("auth yo'q -> 401", async () => {
    clearSession()
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("Content-Type Excel MIME turi bo'ladi", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('spreadsheetml.sheet')
  })

  it("Content-Disposition attachment + .xlsx kengaytma", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const disposition = res.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toMatch(/\.xlsx/)
  })

  it("bo'sh natija ham muvaffaqiyatli qaytadi (bo'sh jadvallar bilan)", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
    const buffer = await res.arrayBuffer()
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
