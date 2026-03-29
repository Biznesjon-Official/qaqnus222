'use client'

import { useEffect, useState, useRef } from 'react'
import { formatSum } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ShoppingCart, CheckCircle, X, Printer, Clock, User, Package,
  RefreshCw, Banknote, CreditCard, Layers, AlertCircle, Store
} from 'lucide-react'

interface BuyurtmaItem {
  id: string
  tovarId: string
  miqdor: number
  birlikNarxi: number
  jami: number
  tovar: { id: string; nomi: string; birlik: string }
}

interface Buyurtma {
  id: string
  holati: string
  jamiSumma: number
  izoh: string | null
  yaratilgan: string
  sotuvchi: { id: string; ism: string }
  mijoz: { id: string; ism: string; telefon: string | null } | null
  tarkiblar: BuyurtmaItem[]
}

const HOLAT = {
  KUTILMOQDA:    { label: 'Kutilmoqda',    short: 'Kutilmoqda',    color: 'amber' },
  TASDIQLANGAN:  { label: 'Tasdiqlangan',  short: 'Tasdiqlangan',  color: 'green' },
  BEKOR_QILINGAN:{ label: 'Bekor qilingan',short: 'Bekor',         color: 'red'   },
}

function avatarColor(ism: string) {
  const colors = [
    'bg-red-500','bg-orange-500','bg-amber-500','bg-green-600',
    'bg-teal-500','bg-blue-500','bg-indigo-500','bg-purple-500','bg-pink-500',
  ]
  let h = 0
  for (let i = 0; i < ism.length; i++) h = (h * 31 + ism.charCodeAt(i)) % colors.length
  return colors[h]
}

export default function BuyurtmalarPage() {
  const [buyurtmalar, setBuyurtmalar] = useState<Buyurtma[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [filter, setFilter] = useState('KUTILMOQDA')
  const [tasdiqlashModal, setTasdiqlashModal] = useState<Buyurtma | null>(null)
  const [tolovUsuli, setTolovUsuli] = useState('NAQD')
  const [tasdiqlashYuklash, setTasdiqlashYuklash] = useState(false)
  const [yangiSoni, setYangiSoni] = useState(0)
  const avvalgiSon = useRef(0)
  const counts = useRef<Record<string, number>>({})

  async function yuklash(silent = false) {
    if (!silent) setYuklanmoqda(true)
    const res = await fetch(`/api/buyurtmalar?holati=${filter}`).then(r => r.json())
    const list: Buyurtma[] = Array.isArray(res) ? res : []
    setBuyurtmalar(list)
    if (!silent) setYuklanmoqda(false)

    if (filter === 'KUTILMOQDA') {
      const soni = list.length
      if (avvalgiSon.current > 0 && soni > avvalgiSon.current) {
        const diff = soni - avvalgiSon.current
        toast.info(`${diff} ta yangi buyurtma keldi!`, { duration: 4000 })
        setYangiSoni(diff)
        setTimeout(() => setYangiSoni(0), 5000)
      }
      avvalgiSon.current = soni
    }
  }

  useEffect(() => { yuklash() }, [filter])

  useEffect(() => {
    if (filter !== 'KUTILMOQDA') return
    const interval = setInterval(() => yuklash(true), 4000)
    return () => clearInterval(interval)
  }, [filter])

  function vaqtFormat(sana: string) {
    const d = new Date(sana)
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
    if (diffMin < 1) return 'Hozirgina'
    if (diffMin < 60) return `${diffMin} daq`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} soat`
    return d.toLocaleDateString('uz-UZ')
  }

  async function tasdiqlash() {
    if (!tasdiqlashModal) return
    setTasdiqlashYuklash(true)
    try {
      await fetch(`/api/buyurtmalar/${tasdiqlashModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holati: 'TASDIQLANGAN' })
      })

      const sotuvRes = await fetch('/api/sotuvlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarkiblar: tasdiqlashModal.tarkiblar.map(t => ({
            tovarId: t.tovarId, miqdor: t.miqdor,
            birlikNarxi: t.birlikNarxi, chegirma: 0, jami: t.jami,
          })),
          jamiSumma: tasdiqlashModal.jamiSumma,
          yakuniySumma: tasdiqlashModal.jamiSumma,
          chegirma: 0, tolovUsuli,
          naqdTolangan: tolovUsuli === 'NAQD' ? tasdiqlashModal.jamiSumma : 0,
          kartaTolangan: tolovUsuli === 'KARTA' ? tasdiqlashModal.jamiSumma : 0,
        })
      })

      if (sotuvRes.ok) {
        const sotuv = await sotuvRes.json()
        toast.success('Buyurtma tasdiqlandi!')
        setTasdiqlashModal(null)
        yuklash()
        chekChop(sotuv, tasdiqlashModal)
      } else {
        const d = await sotuvRes.json()
        toast.error(d.xato || 'Sotuv yaratishda xatolik')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    }
    setTasdiqlashYuklash(false)
  }

  async function bekorQilish(id: string) {
    if (!confirm('Buyurtmani bekor qilasizmi?')) return
    await fetch(`/api/buyurtmalar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holati: 'BEKOR_QILINGAN' })
    })
    toast.success('Bekor qilindi')
    yuklash()
  }

  function chekChop(sotuv: any, buyurtma: Buyurtma) {
    const tovarlarHtml = buyurtma.tarkiblar.map(t =>
      `<tr><td style="font-weight:600">${t.tovar.nomi}</td><td style="text-align:right">${t.miqdor} x ${formatSum(t.birlikNarxi)}</td></tr>` +
      `<tr><td></td><td style="text-align:right;font-weight:bold">${formatSum(t.jami)}</td></tr>`
    ).join('')

    const tolovHtml = tolovUsuli === 'KARTA'
      ? `<tr><td>To'lov:</td><td style="text-align:right">Karta</td></tr>`
      : `<tr><td>To'lov:</td><td style="text-align:right">Naqd pul</td></tr>`

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page{size:76mm auto;margin:0mm}
  html,body{margin:0!important;padding:0!important;height:auto!important;overflow:visible!important}
  *{page-break-inside:avoid!important}
  body{font-family:'Courier New',monospace;font-size:11px;font-weight:bold;width:76mm;margin:0;padding:0 3mm;color:#000;background:#fff}
  table{width:100%;border-collapse:collapse}td{vertical-align:top;padding:1px 0;font-size:11px;font-weight:bold}
  .center{text-align:center}.sep{border-top:1px dashed #000;margin:3px 0}
  .total td{font-size:13px}
</style></head><body>
<div class="center" style="font-size:14px;font-weight:bold">QAQNUS 222</div>
<div class="sep"></div>
<div>Chek: ${sotuv.chekRaqami || '#' + Date.now()}</div>
<div>Sotuvchi: ${buyurtma.sotuvchi.ism}</div>
${buyurtma.mijoz ? `<div>Mijoz: ${buyurtma.mijoz.ism}</div>` : ''}
<div class="sep"></div>
<table>${tovarlarHtml}</table>
<div class="sep"></div>
<table><tr class="total"><td>JAMI:</td><td style="text-align:right">${formatSum(buyurtma.jamiSumma)}</td></tr></table>
<div class="sep"></div>
<table>${tolovHtml}</table>
<div class="sep"></div>
<div class="center" style="font-size:10px">Rahmat!</div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank', 'width=250,height=600,toolbar=no,menubar=no,location=no,status=no')
    if (!win) { URL.revokeObjectURL(url); return }
    win.addEventListener('load', () => {
      setTimeout(() => {
        win.print()
        win.addEventListener('afterprint', () => { win.close(); URL.revokeObjectURL(url) })
      }, 200)
    })
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ─── Top bar ─── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-1">
          {(['KUTILMOQDA','TASDIQLANGAN','BEKOR_QILINGAN'] as const).map(h => {
            const active = filter === h
            const isKutil = h === 'KUTILMOQDA'
            return (
              <button
                key={h}
                onClick={() => setFilter(h)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? isKutil ? 'bg-amber-500 text-white shadow-sm'
                      : h === 'TASDIQLANGAN' ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                {HOLAT[h].label}
                {active && buyurtmalar.length > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-gray-200'}`}>
                    {buyurtmalar.length}
                  </span>
                )}
                {isKutil && yangiSoni > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {yangiSoni}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => yuklash()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl transition"
        >
          <RefreshCw size={14} />
          Yangilash
        </button>
      </div>

      {/* ─── Content ─── */}
      {yuklanmoqda ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
            <p>Yuklanmoqda...</p>
          </div>
        </div>
      ) : buyurtmalar.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Buyurtma yo'q</p>
            <p className="text-sm mt-1 opacity-60">{HOLAT[filter as keyof typeof HOLAT]?.label} buyurtmalar topilmadi</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-4 lg:-mx-6 px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
            {buyurtmalar.map(b => (
              <div
                key={b.id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border flex flex-col transition-all hover:shadow-md ${
                  b.holati === 'KUTILMOQDA'
                    ? 'border-amber-200 dark:border-amber-800/40 shadow-sm'
                    : 'border-gray-200 dark:border-neutral-800'
                }`}
              >
                {/* Card top stripe */}
                <div className={`h-1 w-full rounded-t-2xl ${
                  b.holati === 'KUTILMOQDA' ? 'bg-amber-400' :
                  b.holati === 'TASDIQLANGAN' ? 'bg-green-500' : 'bg-red-400'
                }`} />

                {/* Sotuvchi + time */}
                <div className="flex items-start justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(b.sotuvchi.ism)}`}>
                      {b.sotuvchi.ism[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{b.sotuvchi.ism}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Store size={10} />
                        Sotuvchi
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatSum(b.jamiSumma)}</p>
                    <p className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                      <Clock size={10} />{vaqtFormat(b.yaratilgan)}
                    </p>
                  </div>
                </div>

                {/* Mijoz (if selected) */}
                {b.mijoz && (
                  <div className="mx-4 mb-2 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-2.5 py-1.5">
                    <User size={12} className="text-blue-500 shrink-0" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">{b.mijoz.ism}</span>
                    {b.mijoz.telefon && <span className="text-xs text-blue-400 ml-auto shrink-0">{b.mijoz.telefon}</span>}
                  </div>
                )}

                {/* Divider */}
                <div className="mx-4 border-t border-gray-100 dark:border-neutral-800" />

                {/* Items */}
                <div className="px-4 py-2.5 space-y-1.5 flex-1">
                  {b.tarkiblar.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Package size={11} className="text-gray-300 dark:text-gray-600 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{t.tovar.nomi}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">{t.miqdor} × {formatSum(t.birlikNarxi)}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[60px] text-right">{formatSum(t.jami)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {b.holati === 'KUTILMOQDA' && (
                  <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-gray-100 dark:border-neutral-800 mt-1">
                    <button
                      onClick={() => { setTasdiqlashModal(b); setTolovUsuli('NAQD') }}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-xl py-2.5 font-semibold text-sm transition"
                    >
                      <CheckCircle size={15} />
                      Tasdiqlash
                    </button>
                    <button
                      onClick={() => bekorQilish(b.id)}
                      title="Bekor qilish"
                      className="w-10 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-gray-500 dark:text-gray-400 rounded-xl transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {b.holati === 'TASDIQLANGAN' && (
                  <div className="px-4 pb-3 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl w-full justify-center">
                      <CheckCircle size={13} /> Tasdiqlangan
                    </span>
                  </div>
                )}

                {b.holati === 'BEKOR_QILINGAN' && (
                  <div className="px-4 pb-3 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl w-full justify-center">
                      <AlertCircle size={13} /> Bekor qilingan
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tasdiqlash modal ─── */}
      {tasdiqlashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">To'lov usulini tanlang</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Store size={13} />
                    {tasdiqlashModal.sotuvchi.ism}
                  </span>
                  {tasdiqlashModal.mijoz && (
                    <span className="text-sm text-blue-500 flex items-center gap-1">
                      <User size={13} />
                      {tasdiqlashModal.mijoz.ism}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setTasdiqlashModal(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg shrink-0">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Items */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                {tasdiqlashModal.tarkiblar.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{t.tovar.nomi} × {t.miqdor}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 shrink-0">{formatSum(t.jami)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-neutral-700 pt-2 mt-1 flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-gray-100">Jami</span>
                  <span className="text-red-600 text-lg">{formatSum(tasdiqlashModal.jamiSumma)}</span>
                </div>
              </div>

              {/* To'lov usuli */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'NAQD',   label: 'Naqd pul', icon: Banknote },
                  { val: 'KARTA',  label: 'Karta',     icon: CreditCard },
                  { val: 'ARALASH',label: 'Aralash',   icon: Layers },
                  { val: 'NASIYA', label: 'Nasiya',    icon: Clock },
                ].filter(({ val }) => val !== 'NASIYA' || !!tasdiqlashModal.mijoz)
                 .map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() => setTolovUsuli(val)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition ${
                      tolovUsuli === val
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                        : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTasdiqlashModal(null)}
                  className="flex-1 py-3 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  Bekor
                </button>
                <button
                  onClick={tasdiqlash}
                  disabled={tasdiqlashYuklash}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  {tasdiqlashYuklash ? 'Tasdiqlanmoqda...' : 'Tasdiqlash + Chek'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
