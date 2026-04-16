'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useSotuvlarFilters } from './_hooks/useSotuvlarFilters'
import type { AnalitikaJavobi, SotuvQatori } from './_types'
import { DateRangePicker } from './_components/DateRangePicker'
import { ActiveFilterChips } from './_components/ActiveFilterChips'
import { HeroMetrics } from './_components/HeroMetrics'
import { SalesTrendChart } from './_components/SalesTrendChart'
import { BreakdownTabs } from './_components/BreakdownTabs'
import { SalesTable } from './_components/SalesTable'
import { SaleDetailPanel } from './_components/SaleDetailPanel'
import { HeroMetricsSkeleton, ChartSkeleton, TableSkeleton } from './_components/SkeletonLoaders'

export default function SotuvlarPage() {
  const { filtrlar, yangilash, tozalash } = useSotuvlarFilters()
  const [analitika, setAnalitika] = useState<AnalitikaJavobi | null>(null)
  const [sotuvlar, setSotuvlar] = useState<SotuvQatori[]>([])
  const [jami, setJami] = useState(0)
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [tanlangan, setTanlangan] = useState<SotuvQatori | null>(null)

  useEffect(() => {
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
    })
    fetch(`/api/sotuvlar/analitika?${qs}`)
      .then((r) => r.json())
      .then(setAnalitika)
      .catch(() => setAnalitika(null))
  }, [filtrlar.dan, filtrlar.gacha, filtrlar.kassirId, filtrlar.mijozId, filtrlar.tolovUsuli])

  useEffect(() => {
    setYuklanmoqda(true)
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      page: String(filtrlar.page),
      limit: String(filtrlar.limit),
      sort: filtrlar.sort,
      order: filtrlar.order,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
      ...(filtrlar.q ? { q: filtrlar.q } : {}),
    })
    fetch(`/api/sotuvlar?${qs}`)
      .then((r) => r.json())
      .then((res) => {
        setSotuvlar(res.sotuvlar ?? [])
        setJami(res.jami ?? 0)
      })
      .finally(() => setYuklanmoqda(false))
  }, [filtrlar])

  const activeChips = useMemo(() => {
    const arr: Array<{ key: string; label: string }> = []
    if (filtrlar.kassirId) arr.push({ key: 'kassirId', label: `Kassir tanlangan` })
    if (filtrlar.mijozId) arr.push({ key: 'mijozId', label: `Mijoz tanlangan` })
    if (filtrlar.tolovUsuli) arr.push({ key: 'tolovUsuli', label: `To'lov: ${filtrlar.tolovUsuli}` })
    if (filtrlar.q) arr.push({ key: 'q', label: `Qidiruv: ${filtrlar.q}` })
    return arr
  }, [filtrlar])

  function downloadExcel() {
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
    })
    window.location.href = `/api/sotuvlar/export?${qs}`
  }

  function prev() {
    if (!tanlangan) return
    const i = sotuvlar.findIndex((s) => s.id === tanlangan.id)
    if (i > 0) setTanlangan(sotuvlar[i - 1])
  }
  function next() {
    if (!tanlangan) return
    const i = sotuvlar.findIndex((s) => s.id === tanlangan.id)
    if (i < sotuvlar.length - 1 && i !== -1) setTanlangan(sotuvlar[i + 1])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sotuvlar hisoboti</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadExcel}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <DateRangePicker
          dan={filtrlar.dan}
          gacha={filtrlar.gacha}
          onChange={({ dan, gacha }) => yangilash({ dan, gacha })}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Qidiruv: chek raqami, mijoz ismi..."
            defaultValue={filtrlar.q ?? ''}
            onChange={(e) => {
              const v = e.target.value
              const t = window.setTimeout(() => yangilash({ q: v || undefined }), 300)
              const tgt = e.target as HTMLInputElement & { _t?: number }
              if (tgt._t) clearTimeout(tgt._t)
              tgt._t = t
            }}
            className="flex-1 min-w-[200px] max-w-md px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <ActiveFilterChips
            labels={activeChips}
            onRemove={(k) => yangilash({ [k]: undefined } as Partial<typeof filtrlar>)}
            onClearAll={tozalash}
          />
        </div>
      </div>

      {analitika ? (
        <HeroMetrics
          jamiSotuv={analitika.jamiSotuv}
          sotuvSoni={analitika.sotuvSoni}
          ortachaChek={analitika.ortachaChek}
          jamiFoyda={analitika.jamiFoyda}
          oldingiDavr={analitika.oldingiDavr}
          kunlikGrafik={analitika.kunlikGrafik}
        />
      ) : (
        <HeroMetricsSkeleton />
      )}

      {analitika ? <SalesTrendChart data={analitika.kunlikGrafik} /> : <ChartSkeleton />}

      {analitika && (
        <BreakdownTabs
          data={analitika}
          onKassirClick={(kassirId) => yangilash({ kassirId })}
          onMijozClick={(mijozId) => yangilash({ mijozId })}
          onTolovClick={(tolovUsuli) => yangilash({ tolovUsuli: tolovUsuli as AnalitikaJavobi['tolovUsullari'][number]['tolovUsuli'] })}
        />
      )}

      {yuklanmoqda ? (
        <TableSkeleton rows={8} />
      ) : (
        <SalesTable
          rows={sotuvlar}
          jami={jami}
          page={filtrlar.page}
          limit={filtrlar.limit}
          sort={filtrlar.sort}
          order={filtrlar.order}
          onRowClick={setTanlangan}
          onSortChange={(field) =>
            yangilash({
              sort: field,
              order: filtrlar.sort === field && filtrlar.order === 'desc' ? 'asc' : 'desc',
            })
          }
          onPageChange={(page) => yangilash({ page })}
        />
      )}

      <SaleDetailPanel
        open={!!tanlangan}
        sotuv={tanlangan}
        onClose={() => setTanlangan(null)}
        onPrev={prev}
        onNext={next}
      />

      {yuklanmoqda && !analitika && (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-md">
          <Loader2 size={14} className="animate-spin text-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Yuklanmoqda...</span>
        </div>
      )}
    </div>
  )
}
