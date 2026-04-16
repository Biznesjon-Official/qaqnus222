'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { Filtrlar } from '../_types'

function oyBoshiniOlish(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function bugunOlish(): string {
  return new Date().toISOString().slice(0, 10)
}

/** URL params bilan sinxron filtrlar. Qiymat o'zgartirilganda URL yangilanadi. */
export function useSotuvlarFilters(): {
  filtrlar: Filtrlar
  yangilash: (patch: Partial<Filtrlar>) => void
  tozalash: () => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const filtrlar: Filtrlar = useMemo(
    () => ({
      dan: sp.get('dan') ?? oyBoshiniOlish(),
      gacha: sp.get('gacha') ?? bugunOlish(),
      kassirId: sp.get('kassirId') ?? undefined,
      mijozId: sp.get('mijozId') ?? undefined,
      tolovUsuli: (sp.get('tolovUsuli') as Filtrlar['tolovUsuli']) ?? undefined,
      q: sp.get('q') ?? undefined,
      sort: (sp.get('sort') as Filtrlar['sort']) ?? 'sana',
      order: (sp.get('order') as Filtrlar['order']) ?? 'desc',
      page: Math.max(1, parseInt(sp.get('page') ?? '1')),
      limit: Math.max(10, Math.min(100, parseInt(sp.get('limit') ?? '50'))),
    }),
    [sp]
  )

  const yangilash = useCallback(
    (patch: Partial<Filtrlar>) => {
      const yangi = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '') yangi.delete(k)
        else yangi.set(k, String(v))
      }
      if (patch.q !== undefined || patch.kassirId !== undefined || patch.mijozId !== undefined || patch.tolovUsuli !== undefined || patch.dan !== undefined || patch.gacha !== undefined) {
        yangi.set('page', '1')
      }
      router.replace(`${pathname}?${yangi.toString()}`, { scroll: false })
    },
    [router, pathname, sp]
  )

  const tozalash = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return { filtrlar, yangilash, tozalash }
}
