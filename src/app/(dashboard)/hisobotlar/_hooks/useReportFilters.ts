'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { ReportTur } from '@/lib/hisobotlar'

export function useReportFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const filtrlar = useMemo(
    () => ({
      tab: sp.get('tab') ?? 'umumiy',
      tur: (sp.get('tur') ?? 'oylik') as ReportTur,
      dan: sp.get('dan') ?? '',
      gacha: sp.get('gacha') ?? '',
    }),
    [sp],
  )

  const yangilash = useCallback(
    (patch: Partial<typeof filtrlar>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '') params.delete(k)
        else params.set(k, String(v))
      }
      // Agar tur o'zgarsa va preset bo'lsa, dan/gacha tozalash
      if (patch.tur !== undefined && patch.tur !== 'maxsus') {
        params.delete('dan')
        params.delete('gacha')
      }
      // Agar dan/gacha o'zgarsa, tur=maxsus
      if (patch.dan !== undefined || patch.gacha !== undefined) {
        params.set('tur', 'maxsus')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, sp],
  )

  return { filtrlar, yangilash }
}
