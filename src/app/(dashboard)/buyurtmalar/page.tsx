'use client'

import { useEffect, useState, useRef } from 'react'
import { formatSum } from '@/lib/utils'
import { toast } from 'sonner'
import { ShoppingCart, CheckCircle, X, Printer, Clock, User, Package, RefreshCw, Banknote, CreditCard, Layers } from 'lucide-react'

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

export default function BuyurtmalarPage() {
  const [buyurtmalar, setBuyurtmalar] = useState<Buyurtma[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [filter, setFilter] = useState('KUTILMOQDA')
  const [tasdiqlashModal, setTasdiqlashModal] = useState<Buyurtma | null>(null)
  const [tolovUsuli, setTolovUsuli] = useState('NAQD')
  const [tasdiqlashYuklash, setTasdiqlashYuklash] = useState(false)
  const [yangiSoni, setYangiSoni] = useState(0)
  const avvalgiSon = useRef(0)

  async function yuklash(silent = false) {
    if (!silent) setYuklanmoqda(true)
    const res = await fetch(`/api/buyurtmalar?holati=${filter}`).then(r => r.json())
    const list: Buyurtma[] = Array.isArray(res) ? res : []
    setBuyurtmalar(list)
    if (!silent) setYuklanmoqda(false)

    // Yangi buyurtma xabardorlik
    if (filter === 'KUTILMOQDA') {
      const soni = list.length
      if (avvalgiSon.current > 0 && soni > avvalgiSon.current) {
        toast.info(`${soni - avvalgiSon.current} ta yangi buyurtma keldi!`, { duration: 4000 })
        setYangiSoni(soni - avvalgiSon.current)
        setTimeout(() => setYangiSoni(0), 5000)
      }
      avvalgiSon.current = soni
    }
  }

  useEffect(() => { yuklash() }, [filter])

  // Real-time polling — 4 soniyada bir
  useEffect(() => {
    if (filter !== 'KUTILMOQDA') return
    const interval = setInterval(() => yuklash(true), 4000)
    return () => clearInterval(interval)
  }, [filter])

  function vaqtFormat(sana: string) {
    const d = new Date(sana)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Hozirgina'
    if (diffMin < 60) return `${diffMin} daq oldin`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH} soat oldin`
    return d.toLocaleDateString('uz-UZ')
  }

  async function tasdiqlash() {
    if (!tasdiqlashModal) return
    setTasdiqlashYuklash(true)
    try {
      // 1. Buyurtmani TASDIQLANGAN qil
      await fetch(`/api/buyurtmalar/${tasdiqlashModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holati: 'TASDIQLANGAN' })
      })

      // 2. Real sotuv yarat
      const sotuvRes = await fetch('/api/sotuvlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarkiblar: tasdiqlashModal.tarkiblar.map(t => ({
            tovarId: t.tovarId,
            miqdor: t.miqdor,
            birlikNarxi: t.birlikNarxi,
            chegirma: 0,
            jami: t.jami,
          })),
          jamiSumma: tasdiqlashModal.jamiSumma,
          yakuniySumma: tasdiqlashModal.jamiSumma,
          chegirma: 0,
          tolovUsuli,
          naqdTolangan: tolovUsuli === 'NAQD' ? tasdiqlashModal.jamiSumma : 0,
          kartaTolangan: tolovUsuli === 'KARTA' ? tasdiqlashModal.jamiSumma : 0,
        })
      })

      if (sotuvRes.ok) {
        const sotuv = await sotuvRes.json()
        toast.success('Buyurtma tasdiqlandi!')
        setTasdiqlashModal(null)
        yuklash()

        // Chek chop etish
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

  const holatiConfig = {
    KUTILMOQDA: { label: 'Kutilmoqda', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    TASDIQLANGAN: { label: 'Tasdiqlangan', cls: 'bg-green-50 text-green-600 border-green-200' },
    BEKOR_QILINGAN: { label: 'Bekor qilingan', cls: 'bg-red-50 text-red-500 border-red-200' },
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['KUTILMOQDA', 'TASDIQLANGAN', 'BEKOR_QILINGAN'] as const).map(h => (
          <button
            key={h}
            onClick={() => setFilter(h)}
            className={`relative text-left rounded-2xl p-4 border-2 transition-all ${filter === h ? 'border-red-500 shadow-md' : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'} bg-white dark:bg-neutral-900`}
          >
            {h === 'KUTILMOQDA' && yangiSoni > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {yangiSoni}
              </span>
            )}
            <p className="text-gray-500 text-xs">{holatiConfig[h].label}</p>
            <p className={`text-2xl font-bold mt-1 ${h === 'KUTILMOQDA' ? 'text-amber-600' : h === 'TASDIQLANGAN' ? 'text-green-600' : 'text-red-500'}`}>
              {filter === h ? buyurtmalar.length : '—'} ta
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
          <ShoppingCart size={18} className="text-red-500" />
          Buyurtmalar
        </h2>
        <button
          onClick={() => yuklash()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition"
        >
          <RefreshCw size={14} />
          Yangilash
        </button>
      </div>

      {/* List */}
      {yuklanmoqda ? (
        <div className="text-center text-gray-400 py-16">Yuklanmoqda...</div>
      ) : buyurtmalar.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
          <p>Buyurtma yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buyurtmalar.map(b => (
            <div key={b.id} className={`bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden transition-all ${b.holati === 'KUTILMOQDA' ? 'border-amber-200 dark:border-amber-900/40 shadow-sm' : 'border-gray-200 dark:border-neutral-800'}`}>
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${b.holati === 'KUTILMOQDA' ? 'bg-amber-100 dark:bg-amber-900/30' : b.holati === 'TASDIQLANGAN' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <User size={16} className={b.holati === 'KUTILMOQDA' ? 'text-amber-600' : b.holati === 'TASDIQLANGAN' ? 'text-green-600' : 'text-red-500'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{b.sotuvchi.ism}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />{vaqtFormat(b.yaratilgan)}
                      {b.mijoz && <span className="ml-1 text-blue-500">· {b.mijoz.ism}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatSum(b.jamiSumma)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${holatiConfig[b.holati as keyof typeof holatiConfig]?.cls}`}>
                    {holatiConfig[b.holati as keyof typeof holatiConfig]?.label}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="px-4 py-2 space-y-1">
                {b.tarkiblar.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><Package size={12} className="text-gray-300" />{t.tovar.nomi}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.miqdor} × {formatSum(t.birlikNarxi)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {b.holati === 'KUTILMOQDA' && (
                <div className="flex gap-2 px-4 pb-3 pt-1">
                  <button
                    onClick={() => { setTasdiqlashModal(b); setTolovUsuli('NAQD') }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-xl py-2.5 font-medium text-sm transition"
                  >
                    <CheckCircle size={16} />
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => bekorQilish(b.id)}
                    className="px-4 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tasdiqlash modal */}
      {tasdiqlashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">To'lov usulini tanlang</h3>
              <button onClick={() => setTasdiqlashModal(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Items recap */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-3 space-y-1">
                {tasdiqlashModal.tarkiblar.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.tovar.nomi} × {t.miqdor}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatSum(t.jami)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-neutral-700 pt-1 mt-1 flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-gray-100">Jami</span>
                  <span className="text-red-600">{formatSum(tasdiqlashModal.jamiSumma)}</span>
                </div>
              </div>

              {/* To'lov usuli */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'NAQD', label: 'Naqd pul', icon: Banknote },
                  { val: 'KARTA', label: 'Karta', icon: CreditCard },
                  { val: 'ARALASH', label: 'Aralash', icon: Layers },
                  { val: 'NASIYA', label: 'Nasiya', icon: Clock },
                ].map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() => setTolovUsuli(val)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 font-medium text-sm transition ${tolovUsuli === val ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600' : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
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
