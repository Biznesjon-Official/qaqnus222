'use client'
import { useEffect, useState, useCallback } from 'react'

export function useReportData<T>(
  endpoint: string,
  filtrlar: { tur: string; dan: string; gacha: string; [key: string]: unknown },
): {
  data: T | null
  yuklanmoqda: boolean
  xato: string | null
  qaytaYuklash: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [xato, setXato] = useState<string | null>(null)

  const filtrlarJson = JSON.stringify(filtrlar)

  const yukla = useCallback(async () => {
    setYuklanmoqda(true)
    setXato(null)
    try {
      const qs = new URLSearchParams()
      const parsed = JSON.parse(filtrlarJson) as Record<string, unknown>
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
      }
      const res = await fetch(`${endpoint}?${qs.toString()}`)
      if (!res.ok) throw new Error("Ma'lumot yuklanmadi")
      const json = (await res.json()) as T
      setData(json)
    } catch (e) {
      setXato(e instanceof Error ? e.message : 'Server xatosi')
      setData(null)
    } finally {
      setYuklanmoqda(false)
    }
  }, [endpoint, filtrlarJson])

  useEffect(() => {
    void yukla()
  }, [yukla])

  return { data, yuklanmoqda, xato, qaytaYuklash: yukla }
}
