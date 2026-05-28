'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Printer, Link as LinkIcon, Undo2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatSum } from '@/lib/utils'
import { buildChekHtml, chekChopEtish, type ChekDokonInfo } from '@/lib/chek-print'
import type { SotuvQatori } from '../_types'

interface Props {
  open: boolean
  sotuv: SotuvQatori | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

// Module-level cache — bir sahifa hayoti davomida fetch qilingan resurslar
let _dokonInfoCache: ChekDokonInfo | null = null
let _qrCache: string = ''
let _qrLoading: Promise<string> | null = null

async function loadDokonInfo(): Promise<ChekDokonInfo> {
  if (_dokonInfoCache) return _dokonInfoCache
  try {
    const r = await fetch('/api/sozlamalar')
    const data = await r.json()
    _dokonInfoCache = data && typeof data === 'object' ? data : {}
    return _dokonInfoCache!
  } catch {
    return {}
  }
}

async function loadQr(): Promise<string> {
  if (_qrCache) return _qrCache
  if (_qrLoading) return _qrLoading
  _qrLoading = fetch('/telegramqr.png')
    .then(r => r.blob())
    .then(blob => new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    }))
    .then(b64 => { _qrCache = b64; return b64 })
    .catch(() => '')
  return _qrLoading
}

export function SaleDetailPanel({ open, sotuv, onClose, onPrev, onNext }: Props) {
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.altKey && e.key === 'ArrowLeft') onPrev()
      if (e.altKey && e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, onPrev, onNext])

  if (!open || !sotuv) return null

  const chekLink = `/chek/${sotuv.chekRaqami}`

  async function chekniChopEtish() {
    if (!sotuv) return
    setPrinting(true)
    try {
      const [dokonInfo, qrBase64] = await Promise.all([loadDokonInfo(), loadQr()])
      const html = buildChekHtml({
        data: {
          chekRaqami: sotuv.chekRaqami,
          sana: sotuv.sana,
          tarkiblar: sotuv.tarkiblar.map(tk => ({
            tovar: { nomi: tk.tovar.nomi },
            miqdor: tk.miqdor,
            birlikNarxi: tk.birlikNarxi,
            jami: tk.jami,
          })),
          chegirma: sotuv.chegirma,
          yakuniySumma: sotuv.yakuniySumma,
          tolovUsuli: sotuv.tolovUsuli,
          naqdTolangan: (sotuv as any).naqdTolangan,
          kartaTolangan: (sotuv as any).kartaTolangan,
          mijoz: sotuv.mijoz ? { ism: sotuv.mijoz.ism } : null,
          kassir: { telefon: (sotuv.kassir as any).telefon || null },
        },
        dokonInfo,
        telegramQrBase64: qrBase64,
      })
      chekChopEtish(html)
    } catch (e: any) {
      toast.error(e?.message || 'Chek chop etilmadi')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-labelledby="sale-detail-title"
      className="fixed inset-0 z-50 flex"
    >
      <div className="flex-1 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 id="sale-detail-title" className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {sotuv.chekRaqami}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(sotuv.sana).toLocaleString('uz-UZ')}
            </p>
          </div>
          <div className="flex gap-1">
            <button aria-label="Oldingi sotuv" onClick={onPrev} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronLeft size={16} />
            </button>
            <button aria-label="Keyingi sotuv" onClick={onNext} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronRight size={16} />
            </button>
            <button aria-label="Yopish" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <section className="space-y-1">
            <Row label="Kassir" value={sotuv.kassir.ism} />
            <Row label="Mijoz" value={sotuv.mijoz?.ism ?? '—'} />
            {sotuv.mijoz?.telefon && <Row label="Telefon" value={sotuv.mijoz.telefon} />}
            <Row label="To'lov" value={sotuv.tolovUsuli} />
            <Row label="Holati" value={sotuv.holati} />
          </section>

          <section>
            <h3 className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
              Tarkib ({sotuv.tarkiblar.length} ta)
            </h3>
            <ul className="space-y-2">
              {sotuv.tarkiblar.map((t, i) => (
                <li key={i} className="flex justify-between items-start text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 dark:text-gray-200 truncate">{t.tovar.nomi}</p>
                    <p className="text-xs text-gray-500">
                      {t.miqdor} {t.tovar.birlik.toLowerCase()} × {formatSum(t.birlikNarxi)}
                    </p>
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 font-medium shrink-0 ml-2">
                    {formatSum(t.jami)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl space-y-1 text-sm">
            <Row label="Chegirma" value={formatSum(sotuv.chegirma)} />
            <Row label="Yakuniy" value={formatSum(sotuv.yakuniySumma)} bold />
          </section>

          {sotuv.nasiya && (
            <section className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <h3 className="text-xs text-amber-800 dark:text-amber-400 tracking-wider mb-2">Nasiya</h3>
              <Row label="Qoldiq" value={formatSum(sotuv.nasiya.qoldiq)} />
              {sotuv.nasiya.muddat && (
                <Row label="Muddat" value={new Date(sotuv.nasiya.muddat).toLocaleDateString('uz-UZ')} />
              )}
              <Row label="Holat" value={sotuv.nasiya.holati} />
            </section>
          )}

          {sotuv.qaytarishlar && sotuv.qaytarishlar.length > 0 && (
            <section className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <h3 className="text-xs text-red-800 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Undo2 size={12} />
                Qaytarishlar ({sotuv.qaytarishlar.length} ta)
              </h3>
              <div className="space-y-3">
                {sotuv.qaytarishlar.map((q) => (
                  <div key={q.id} className="pb-2 border-b border-red-100 dark:border-red-900/40 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-red-700 dark:text-red-400 font-semibold">
                        −{formatSum(q.jamiSumma)}
                      </span>
                      <span className="text-xs text-red-600/70 dark:text-red-500/70">
                        {new Date(q.yaratilgan).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                    {q.sabab && (
                      <p className="text-xs text-red-700/80 dark:text-red-400/80 italic mb-1">
                        Sabab: {q.sabab}
                      </p>
                    )}
                    {q.tarkiblar.length > 0 && (
                      <ul className="space-y-0.5 text-xs text-red-800 dark:text-red-300">
                        {q.tarkiblar.map((t, i) => (
                          <li key={i} className="flex justify-between gap-2">
                            <span className="truncate">
                              {t.tovar.nomi} × {t.miqdor} {t.tovar.birlik.toLowerCase()}
                            </span>
                            <span className="shrink-0">{formatSum(t.jami)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={chekniChopEtish}
              disabled={printing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-60"
            >
              {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              {printing ? 'Tayyorlanmoqda...' : 'Chek chop etish'}
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.location.origin + chekLink
                void navigator.clipboard?.writeText(url)
                toast.success('Link nusxalandi')
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              <LinkIcon size={14} /> Link nusxalash
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, bold = false }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 dark:text-gray-500">{label}</span>
      <span className={bold ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-800 dark:text-gray-200'}>
        {value}
      </span>
    </div>
  )
}
