'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, X, ArrowLeft, Phone,
  Building2, TrendingDown, Banknote, ChevronRight, ChevronDown, RotateCcw, Package, ShoppingBag,
} from 'lucide-react'
import { formatSum } from '@/lib/utils'

interface SherikDokon {
  id: string; nomi: string; telefon: string | null; manzil: string | null
  izoh: string | null; yaratilgan: string
  jamiQarz: number; tolangan: number; qoldiq: number
}

interface SotuvTarkib {
  id: string; tovarId: string; miqdor: number; birlikNarxi: number; jami: number
  tovar: { nomi: string; birlik: string }
}

interface Sotuv {
  id: string; chekRaqami: string; yakuniySumma: number; sana: string
  tarkiblar: SotuvTarkib[]
}

interface TolovRecord {
  id: string; summa: number; izoh: string | null; sana: string
}

interface SherikDetail {
  id: string; nomi: string; telefon: string | null
  sotuvlar: Sotuv[]
  tolovlar: TolovRecord[]
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm'

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

export default function SherikDokonlarPage() {
  const [dokonlar, setDokonlar] = useState<SherikDokon[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)

  // Detail view
  const [tanlangan, setTanlangan] = useState<SherikDokon | null>(null)
  const [detail, setDetail] = useState<SherikDetail | null>(null)
  const [detailYuklanmoqda, setDetailYuklanmoqda] = useState(false)

  // CRUD modal
  const [modal, setModal] = useState(false)
  const [tahrirlash, setTahrirlash] = useState<SherikDokon | null>(null)
  const [form, setForm] = useState({ nomi: '', telefon: '', manzil: '', izoh: '' })

  // To'lov modal
  const [tolovModal, setTolovModal] = useState(false)
  const [tolovSumma, setTolovSumma] = useState('')
  const [tolovIzoh, setTolovIzoh] = useState('')
  const [tolovYuklanmoqda, setTolovYuklanmoqda] = useState(false)

  // Detail tab
  const [detailTab, setDetailTab] = useState<'mahsulotlar' | 'sotuvlar' | 'tolovlar'>('mahsulotlar')
  const [ochiqSotuvlar, setOchiqSotuvlar] = useState<Record<string, boolean>>({})

  // Qarz qo'shish modal
  const [qarzModal, setQarzModal] = useState(false)
  const [qarzSumma, setQarzSumma] = useState('')
  const [qarzIzoh, setQarzIzoh] = useState('')
  const [qarzYuklanmoqda, setQarzYuklanmoqda] = useState(false)

  // Tovar qaytarish modal
  const [qaytarishModal, setQaytarishModal] = useState(false)
  const [qaytarishTanlangan, setQaytarishTanlangan] = useState<Record<string, { miqdor: string; checked: boolean }>>({})
  const [qaytarishYuklanmoqda, setQaytarishYuklanmoqda] = useState(false)

  async function yuklash() {
    setYuklanmoqda(true)
    const res = await fetch('/api/sherik-dokonlar')
    setDokonlar(await res.json())
    setYuklanmoqda(false)
  }

  useEffect(() => { yuklash() }, [])

  async function detailYuklash(d: SherikDokon) {
    setTanlangan(d)
    setDetail(null)
    setDetailYuklanmoqda(true)
    const res = await fetch(`/api/sherik-dokonlar/${d.id}`)
    setDetail(await res.json())
    setDetailYuklanmoqda(false)
  }

  function orqaga() { setTanlangan(null); setDetail(null); yuklash() }

  // CRUD
  function ochModal(d?: SherikDokon) {
    if (d) { setTahrirlash(d); setForm({ nomi: d.nomi, telefon: d.telefon || '', manzil: d.manzil || '', izoh: d.izoh || '' }) }
    else { setTahrirlash(null); setForm({ nomi: '', telefon: '', manzil: '', izoh: '' }) }
    setModal(true)
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    const url = tahrirlash ? `/api/sherik-dokonlar/${tahrirlash.id}` : '/api/sherik-dokonlar'
    const method = tahrirlash ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { toast.success(tahrirlash ? 'Yangilandi' : "Qo'shildi"); setModal(false); yuklash() }
    else { const e = await res.json(); toast.error(e.xato || 'Xatolik') }
  }

  async function ochirish(d: SherikDokon) {
    if (!confirm(`"${d.nomi}" ni o'chirishni tasdiqlaysizmi?`)) return
    const res = await fetch(`/api/sherik-dokonlar/${d.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success("O'chirildi"); yuklash() }
    else { const e = await res.json(); toast.error(e.xato || 'Xatolik') }
  }

  // To'lov
  async function tolovYuborish(e: React.FormEvent) {
    e.preventDefault()
    if (!tanlangan) return
    setTolovYuklanmoqda(true)
    const res = await fetch(`/api/sherik-dokonlar/${tanlangan.id}/tolov`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summa: tolovSumma, izoh: tolovIzoh }),
    })
    setTolovYuklanmoqda(false)
    if (res.ok) {
      toast.success("To'lov qayd etildi")
      setTolovModal(false)
      setTolovSumma('')
      setTolovIzoh('')
      detailYuklash(tanlangan)
      yuklash()
    } else { const e = await res.json(); toast.error(e.xato || 'Xatolik') }
  }

  // Qarz qo'shish
  async function qarzYuborish(e: React.FormEvent) {
    e.preventDefault()
    if (!tanlangan) return
    setQarzYuklanmoqda(true)
    const res = await fetch(`/api/sherik-dokonlar/${tanlangan.id}/tolov`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summa: -Math.abs(parseFloat(qarzSumma)), izoh: qarzIzoh || 'Qo\'shimcha qarz' }),
    })
    setQarzYuklanmoqda(false)
    if (res.ok) {
      toast.success("Qarz qo'shildi")
      setQarzModal(false)
      setQarzSumma('')
      setQarzIzoh('')
      detailYuklash(tanlangan)
      yuklash()
    } else { const e = await res.json(); toast.error(e.xato || 'Xatolik') }
  }

  // Tovar qaytarish
  function qaytarishOch() {
    if (!detail) return
    const init: Record<string, { miqdor: string; checked: boolean }> = {}
    detail.sotuvlar.forEach(s => s.tarkiblar.forEach(t => {
      const key = `${s.id}_${t.tovarId}`
      if (!init[key]) init[key] = { miqdor: String(Number(t.miqdor)), checked: false }
    }))
    setQaytarishTanlangan(init)
    setQaytarishModal(true)
  }

  async function qaytarishYubor() {
    if (!tanlangan || !detail) return
    const items = detail.sotuvlar.flatMap(s => s.tarkiblar.map(t => ({
      key: `${s.id}_${t.tovarId}`,
      tovarId: t.tovarId,
      narx: Number(t.birlikNarxi),
    }))).filter(item => qaytarishTanlangan[item.key]?.checked && parseFloat(qaytarishTanlangan[item.key].miqdor) > 0)
      .map(item => ({
        tovarId: item.tovarId,
        miqdor: parseFloat(qaytarishTanlangan[item.key].miqdor),
        narx: item.narx,
      }))

    if (!items.length) { toast.error('Hech narsa tanlanmagan'); return }

    setQaytarishYuklanmoqda(true)
    const res = await fetch(`/api/sherik-dokonlar/${tanlangan.id}/tolov`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tovarQaytarish: items, izoh: 'Tovar qaytarildi' }),
    })
    setQaytarishYuklanmoqda(false)
    if (res.ok) {
      toast.success('Tovarlar qaytarildi va omborga qo\'shildi')
      setQaytarishModal(false)
      detailYuklash(tanlangan)
      yuklash()
    } else { const e = await res.json(); toast.error(e.xato || 'Xatolik') }
  }

  // ─── Detail view ───
  if (tanlangan) {
    const sotuvQarz = detail?.sotuvlar.reduce((s, sv) => s + Number(sv.yakuniySumma), 0) ?? 0
    const manualQarz = detail?.tolovlar.filter(t => Number(t.summa) < 0).reduce((s, t) => s + Math.abs(Number(t.summa)), 0) ?? 0
    const jami = sotuvQarz + manualQarz
    const tolangan = detail?.tolovlar.filter(t => Number(t.summa) > 0).reduce((s, t) => s + Number(t.summa), 0) ?? 0
    const qoldiq = jami - tolangan

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={orqaga} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            <ArrowLeft size={16} /> Orqaga
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700" />
          <div className="flex-1 min-w-0">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base truncate">{tanlangan.nomi}</h2>
            {tanlangan.telefon && (
              <a href={`tel:${tanlangan.telefon}`} className="text-xs text-blue-600 flex items-center gap-1">
                <Phone size={11} />{tanlangan.telefon}
              </a>
            )}
          </div>
          <button onClick={() => setQarzModal(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition text-sm">
            <Plus size={15} /> Qarz
          </button>
          <button onClick={qaytarishOch}
            className="flex items-center gap-2 px-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition text-sm">
            <RotateCcw size={15} /> Qaytarish
          </button>
          <button onClick={() => setTolovModal(true)}
            className="flex items-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition text-sm">
            <Banknote size={15} /> To&apos;lov
          </button>
        </div>

        {/* Debt summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jami qarz', val: jami, color: 'text-gray-900 dark:text-gray-100' },
            { label: 'To\'langan', val: tolangan, color: 'text-green-600 dark:text-green-400' },
            { label: 'Qoldiq', val: qoldiq, color: qoldiq > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-gray-600 mb-1">{c.label}</p>
              <p className={`font-bold text-base ${c.color}`}>{formatSum(c.val)}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        {(() => {
          // Mahsulotlar guruhlab hisoblash
          const mahsulotMap: Record<string, { nomi: string; birlik: string; miqdor: number; jami: number; sotuvSoni: number }> = {}
          detail?.sotuvlar.forEach(s => s.tarkiblar.forEach(t => {
            const key = t.tovarId
            if (!mahsulotMap[key]) mahsulotMap[key] = { nomi: t.tovar.nomi, birlik: t.tovar.birlik, miqdor: 0, jami: 0, sotuvSoni: 0 }
            mahsulotMap[key].miqdor += Number(t.miqdor)
            mahsulotMap[key].jami += Number(t.jami)
            mahsulotMap[key].sotuvSoni += 1
          }))
          const mahsulotlar = Object.values(mahsulotMap).sort((a, b) => b.jami - a.jami)

          const tabs = [
            { key: 'mahsulotlar' as const, label: 'Mahsulotlar', count: mahsulotlar.length, icon: <Package size={14} /> },
            { key: 'sotuvlar' as const, label: 'Sotuvlar', count: detail?.sotuvlar.length ?? 0, icon: <ShoppingBag size={14} /> },
            { key: 'tolovlar' as const, label: "To'lovlar", count: detail?.tolovlar.length ?? 0, icon: <Banknote size={14} /> },
          ]

          return (
            <>
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                      detailTab === tab.key
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                    }`}>
                    {tab.icon} {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${detailTab === tab.key ? 'bg-white/20' : 'bg-gray-100 dark:bg-neutral-800'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {detailYuklanmoqda ? (
                <div className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</div>
              ) : detailTab === 'mahsulotlar' ? (
                /* ─── MAHSULOTLAR ─── */
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  {mahsulotlar.length === 0 ? (
                    <p className="text-center text-gray-400 dark:text-gray-600 py-12 text-sm">Tovarlar yo&apos;q</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-500 text-xs border-b border-gray-200 dark:border-neutral-800">
                          <th className="text-left px-4 py-3 font-medium">Tovar</th>
                          <th className="text-right px-4 py-3 font-medium">Jami miqdor</th>
                          <th className="text-right px-4 py-3 font-medium">Jami summa</th>
                          <th className="text-center px-4 py-3 font-medium">Necha marta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mahsulotlar.map((m, i) => (
                          <tr key={i} className={`border-b border-gray-100 dark:border-neutral-800 last:border-b-0 ${i % 2 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{m.nomi}</td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(m.miqdor)} {m.birlik}</td>
                            <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">{formatSum(m.jami)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full">{m.sotuvSoni}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700">
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">Jami</td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{formatSum(mahsulotlar.reduce((s, m) => s + m.jami, 0))}</td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              ) : detailTab === 'sotuvlar' ? (
                /* ─── SOTUVLAR ─── */
                <div className="space-y-2">
                  {!detail?.sotuvlar.length ? (
                    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-600">Sotuvlar yo&apos;q</div>
                  ) : detail.sotuvlar.map(s => {
                    const ochiq = ochiqSotuvlar[s.id]
                    return (
                      <div key={s.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                        <button onClick={() => setOchiqSotuvlar(p => ({ ...p, [s.id]: !p[s.id] }))}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition">
                          <div className="flex items-center gap-3">
                            {ochiq ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{s.chekRaqami}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-600">
                              {new Date(s.sana).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-600">{s.tarkiblar.length} ta tovar</span>
                          </div>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatSum(Number(s.yakuniySumma))}</span>
                        </button>
                        {ochiq && (
                          <div className="border-t border-gray-100 dark:border-neutral-800 px-4 py-2">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-400 dark:text-gray-600 text-xs">
                                  <th className="text-left pb-1 font-medium">Tovar</th>
                                  <th className="text-right pb-1 font-medium">Miqdor</th>
                                  <th className="text-right pb-1 font-medium">Narx</th>
                                  <th className="text-right pb-1 font-medium">Jami</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.tarkiblar.map(t => (
                                  <tr key={t.id} className="border-t border-gray-50 dark:border-neutral-800/50">
                                    <td className="py-1.5 text-gray-800 dark:text-gray-200">{t.tovar.nomi}</td>
                                    <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">{fmt(Number(t.miqdor))} {t.tovar.birlik}</td>
                                    <td className="py-1.5 text-right text-gray-500 dark:text-gray-500">{formatSum(Number(t.birlikNarxi))}</td>
                                    <td className="py-1.5 text-right font-semibold text-red-600 dark:text-red-400">{formatSum(Number(t.jami))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* ─── TO'LOVLAR ─── */
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  {!detail?.tolovlar.length ? (
                    <p className="text-center text-gray-400 dark:text-gray-600 py-12 text-sm">Hali yozuv yo&apos;q</p>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-neutral-800">
                      {detail.tolovlar.map(t => {
                        const isQarz = Number(t.summa) < 0
                        return (
                          <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isQarz ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'}`}>
                                  {isQarz ? 'QARZ' : "TO'LOV"}
                                </span>
                                <p className={`text-sm font-semibold ${isQarz ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {isQarz ? '+' : '-'}{formatSum(Math.abs(Number(t.summa)))}
                                </p>
                              </div>
                              {t.izoh && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{t.izoh}</p>}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-600">
                              {new Date(t.sana).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )
        })()}

        {/* To'lov modal */}
        {tolovModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">To&apos;lov — {tanlangan.nomi}</h3>
                <button onClick={() => setTolovModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"><X size={18} /></button>
              </div>
              <form onSubmit={tolovYuborish} className="p-5 space-y-4">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Summa (so&apos;m) *</label>
                  <input type="number" value={tolovSumma} onChange={e => setTolovSumma(e.target.value)}
                    required min="1" placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                  <input value={tolovIzoh} onChange={e => setTolovIzoh(e.target.value)} placeholder="Ixtiyoriy" className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setTolovModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                  <button type="submit" disabled={tolovYuklanmoqda} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                    <Banknote size={15} />{tolovYuklanmoqda ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Qarz qo'shish modal */}
        {qarzModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Qarz qo&apos;shish — {tanlangan.nomi}</h3>
                <button onClick={() => setQarzModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"><X size={18} /></button>
              </div>
              <form onSubmit={qarzYuborish} className="p-5 space-y-4">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Qarz summasi (so&apos;m) *</label>
                  <input type="number" value={qarzSumma} onChange={e => setQarzSumma(e.target.value)}
                    required min="1" placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                  <input value={qarzIzoh} onChange={e => setQarzIzoh(e.target.value)} placeholder="Sabab yoki izoh" className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setQarzModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                  <button type="submit" disabled={qarzYuklanmoqda} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                    <Plus size={15} />{qarzYuklanmoqda ? 'Saqlanmoqda...' : "Qarz qo'shish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tovar qaytarish modal */}
        {qaytarishModal && detail && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
                  <RotateCcw size={16} className="text-amber-600" />
                  Tovar qaytarish — {tanlangan.nomi}
                </h3>
                <button onClick={() => setQaytarishModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Qaytariladigan tovarlarni belgilang va miqdorni kiriting. Tovarlar omborga qaytariladi.</p>
                <div className="space-y-2">
                  {detail.sotuvlar.flatMap(s => s.tarkiblar.map(t => {
                    const key = `${s.id}_${t.tovarId}`
                    const state = qaytarishTanlangan[key]
                    if (!state) return null
                    const jamiSum = parseFloat(state.miqdor || '0') * Number(t.birlikNarxi)
                    return (
                      <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${state.checked ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'border-gray-200 dark:border-neutral-800'}`}>
                        <input
                          type="checkbox"
                          checked={state.checked}
                          onChange={e => setQaytarishTanlangan(prev => ({ ...prev, [key]: { ...prev[key], checked: e.target.checked } }))}
                          className="w-4 h-4 rounded accent-amber-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.tovar.nomi}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-600">
                            {s.chekRaqami} · {fmt(Number(t.miqdor))} {t.tovar.birlik} × {formatSum(Number(t.birlikNarxi))}
                          </p>
                        </div>
                        {state.checked && (
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              value={state.miqdor}
                              onChange={e => setQaytarishTanlangan(prev => ({ ...prev, [key]: { ...prev[key], miqdor: e.target.value } }))}
                              min="0.001"
                              max={Number(t.miqdor)}
                              step="any"
                              className="w-20 px-2 py-1 text-sm text-center border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                            />
                            <span className="text-xs text-amber-600 font-semibold w-24 text-right">{formatSum(jamiSum)}</span>
                          </div>
                        )}
                      </label>
                    )
                  }))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-neutral-800 shrink-0">
                {(() => {
                  const jamiQaytarish = detail.sotuvlar.flatMap(s => s.tarkiblar.map(t => {
                    const key = `${s.id}_${t.tovarId}`
                    const st = qaytarishTanlangan[key]
                    return st?.checked ? parseFloat(st.miqdor || '0') * Number(t.birlikNarxi) : 0
                  })).reduce((a, b) => a + b, 0)
                  return (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500 dark:text-gray-500">Qaytarish summasi:</span>
                      <span className="text-base font-bold text-amber-600">{formatSum(jamiQaytarish)}</span>
                    </div>
                  )
                })()}
                <div className="flex gap-3">
                  <button onClick={() => setQaytarishModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium text-sm">Bekor</button>
                  <button
                    onClick={qaytarishYubor}
                    disabled={qaytarishYuklanmoqda}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-medium transition text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={15} />{qaytarishYuklanmoqda ? 'Saqlanmoqda...' : 'Qaytarish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Main list view ───
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1" />
        <button onClick={() => ochModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <Plus size={16} /> Sherik qo&apos;shish
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Do&apos;kon nomi</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell">Telefon</th>
                <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Jami qarz</th>
                <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Qoldiq</th>
                <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Amal</th>
              </tr>
            </thead>
            <tbody>
              {yuklanmoqda ? (
                <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
              ) : dokonlar.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-12">
                  <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                  Sherik do&apos;konlar topilmadi
                </td></tr>
              ) : dokonlar.map((d, idx) => (
                <tr key={d.id} onClick={() => detailYuklash(d)}
                  className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer ${idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/40'}`}>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{d.nomi}</p>
                    {d.manzil && <p className="text-xs text-gray-400 dark:text-gray-600 truncate max-w-[200px]">{d.manzil}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {d.telefon ? (
                      <a href={`tel:${d.telefon}`} onClick={e => e.stopPropagation()} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                        <Phone size={12} />{d.telefon}
                      </a>
                    ) : <span className="text-gray-400 dark:text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatSum(d.jamiQarz)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${d.qoldiq > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatSum(d.qoldiq)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => detailYuklash(d)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                        <ChevronRight size={15} />
                      </button>
                      <button onClick={() => ochModal(d)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => ochirish(d)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">{tahrirlash ? 'Tahrirlash' : 'Yangi sherik do\'kon'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={saqlash} className="p-5 space-y-4">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Do&apos;kon nomi *</label>
                <input value={form.nomi} onChange={e => setForm(f => ({ ...f, nomi: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Telefon</label>
                <input value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+998..." className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Manzil</label>
                <input value={form.manzil} onChange={e => setForm(f => ({ ...f, manzil: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <textarea value={form.izoh} onChange={e => setForm(f => ({ ...f, izoh: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">{tahrirlash ? 'Saqlash' : "Qo'shish"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
