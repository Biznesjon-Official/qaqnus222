'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSana } from '@/lib/utils'
import { toast } from 'sonner'
import { Phone, Banknote, X, Clock } from 'lucide-react'
import ViewToggle from '@/components/ViewToggle'
import MoneyInput from '@/components/ui/money-input'
import SearchBar from '@/components/ui/search-bar'

interface NasiyaTolov {
  id: string
  summa: number
  tolovUsuli: string
  izoh: string | null
  sana: string
}

interface Nasiya {
  id: string
  mijoz: { ism: string; telefon: string | null }
  sotuv: { chekRaqami: string; sana: string }
  jamiQarz: number; tolangan: number; qoldiq: number
  muddat: string | null; holati: string; sana: string
  tolovlar: NasiyaTolov[]
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

const holatiConfig = {
  OCHIQ: { cls: 'text-amber-600 bg-amber-50', label: 'Ochiq' },
  MUDDATI_OTGAN: { cls: 'text-red-600 bg-red-50', label: "Muddati o'tgan" },
  YOPILGAN: { cls: 'text-green-600 bg-green-50', label: 'Yopilgan' },
}

export default function NasiyalarPage() {
  const [nasiyalar, setNasiyalar] = useState<Nasiya[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [filter, setFilter] = useState('')
  const [qidiruv, setQidiruv] = useState('')
  const [tolovModal, setTolovModal] = useState<Nasiya | null>(null)
  const [tolovForm, setTolovForm] = useState({ summa: '', tolovUsuli: 'NAQD', izoh: '' })
  const [view, setView] = useState<'table' | 'card'>('table')

  async function yuklash() {
    setYuklanmoqda(true)
    const data = await fetch(`/api/nasiyalar${filter ? `?holati=${filter}` : ''}`).then(r => r.json())
    setNasiyalar(data || [])
    setYuklanmoqda(false)
  }

  useEffect(() => {
    // Restore saved view preference from localStorage
    const saved = localStorage.getItem('nasiyalar-view')
    if (saved === 'table' || saved === 'card') setView(saved)
  }, [])

  useEffect(() => { yuklash() }, [filter])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('nasiyalar-view', v)
  }

  /** Open payment modal for a nasiya record */
  function openTolovModal(n: Nasiya) {
    if (n.holati === 'YOPILGAN') return
    setTolovModal(n)
    setTolovForm({ summa: String(n.qoldiq), tolovUsuli: 'NAQD', izoh: '' })
  }

  async function tolovQilish(e: React.FormEvent) {
    e.preventDefault()
    if (!tolovModal) return
    const res = await fetch(`/api/nasiyalar/${tolovModal.id}/tolov`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tolovForm)
    })
    if (res.ok) {
      toast.success("To'lov qabul qilindi!")
      setTolovModal(null)
      setTolovForm({ summa: '', tolovUsuli: 'NAQD', izoh: '' })
      yuklash()
    } else toast.error('Xatolik yuz berdi')
  }

  const filteredNasiyalar = qidiruv
    ? nasiyalar.filter(n =>
        n.mijoz.ism.toLowerCase().includes(qidiruv.toLowerCase()) ||
        n.sotuv.chekRaqami.toLowerCase().includes(qidiruv.toLowerCase())
      )
    : nasiyalar

  return (
    <div className="space-y-4">
      <SearchBar
        value={qidiruv}
        onChange={setQidiruv}
        placeholder="Mijoz ismi yoki chek raqami bo'yicha qidirish..."
        debounceMs={0}
      />

      {/* Filter + ViewToggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2 flex-wrap flex-1">
          {[
            { value: '', label: 'Barchasi' },
            { value: 'OCHIQ', label: 'Ochiq' },
            { value: 'MUDDATI_OTGAN', label: "Muddati o'tgan" },
            { value: 'YOPILGAN', label: 'Yopilgan' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f.value ? 'bg-red-600 text-white' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {/* View toggle placed next to filters */}
        <ViewToggle view={view} onChange={changeView} />
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Mijoz</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Telefon</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Chek</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Holati</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden lg:table-cell whitespace-nowrap">Jami qarz</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden lg:table-cell whitespace-nowrap">To&apos;langan</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Qoldiq</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Muddat</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Amal</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : nasiyalar.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 dark:text-gray-600 py-12">Nasiyalar topilmadi</td></tr>
                ) : filteredNasiyalar.map((n, idx) => {
                  const hCfg = holatiConfig[n.holati as keyof typeof holatiConfig]
                  return (
                    <tr
                      key={n.id}
                      onClick={() => openTolovModal(n)}
                      className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''} ${n.holati !== 'YOPILGAN' ? 'cursor-pointer' : ''}`}
                    >
                      {/* Mijoz */}
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium text-sm whitespace-nowrap">{n.mijoz.ism}</td>
                      {/* Telefon */}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden sm:table-cell whitespace-nowrap">
                        {n.mijoz.telefon ? (
                          <span className="flex items-center gap-1"><Phone size={12} />{n.mijoz.telefon}</span>
                        ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      {/* Chek */}
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">{n.sotuv.chekRaqami}</td>
                      {/* Holati */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${hCfg?.cls || ''}`}>
                          {hCfg?.label || n.holati}
                        </span>
                      </td>
                      {/* Jami qarz */}
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-500 text-sm hidden lg:table-cell whitespace-nowrap">{formatSum(n.jamiQarz)}</td>
                      {/* To'langan */}
                      <td className="px-4 py-3 text-right text-green-600 text-sm hidden lg:table-cell whitespace-nowrap">{formatSum(n.tolangan)}</td>
                      {/* Qoldiq */}
                      <td className="px-4 py-3 text-right text-red-600 font-semibold text-sm whitespace-nowrap">{formatSum(n.qoldiq)}</td>
                      {/* Muddat */}
                      <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">
                        {n.muddat ? formatSana(n.muddat) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      {/* Amal: To'lov button — stop propagation so row click and button don't double-fire */}
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {n.holati !== 'YOPILGAN' ? (
                          <button
                            onClick={() => openTolovModal(n)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium transition">
                            <Banknote size={12} />
                            To&apos;lov
                          </button>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {view === 'card' && (
        <div className="space-y-3">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 text-center py-12">Yuklanmoqda...</p>
          ) : nasiyalar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 text-center py-12">Nasiyalar topilmadi</p>
          ) : filteredNasiyalar.map(n => {
            const hCfg = holatiConfig[n.holati as keyof typeof holatiConfig]
            return (
              <div
                key={n.id}
                onClick={() => openTolovModal(n)}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 transition ${n.holati === 'MUDDATI_OTGAN' ? 'border-red-200 dark:border-red-900' : 'border-gray-200 dark:border-neutral-800'} ${n.holati !== 'YOPILGAN' ? 'cursor-pointer hover:shadow-md' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-900 dark:text-gray-100 font-semibold">{n.mijoz.ism}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${hCfg?.cls || ''}`}>
                        {hCfg?.label || n.holati}
                      </span>
                    </div>
                    {n.mijoz.telefon && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                        <Phone size={12} /> {n.mijoz.telefon}
                      </p>
                    )}
                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                      Chek: {n.sotuv.chekRaqami} • {formatSana(n.sana)}
                      {n.muddat && ` • Muddat: ${formatSana(n.muddat)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-red-600 font-bold text-lg">{formatSum(n.qoldiq)}</p>
                    <p className="text-gray-400 dark:text-gray-600 text-xs">Jami: {formatSum(n.jamiQarz)}</p>
                    <p className="text-green-600 text-xs">To&apos;langan: {formatSum(n.tolangan)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-gray-100 dark:bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (Number(n.tolangan) / Number(n.jamiQarz)) * 100)}%` }}
                  />
                </div>

                {/* Payment button — stop propagation so card click and button don't double-fire */}
                {n.holati !== 'YOPILGAN' && (
                  <button
                    onClick={e => { e.stopPropagation(); openTolovModal(n) }}
                    className="mt-3 w-full py-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                    <Banknote size={15} />
                    To&apos;lov qabul qilish
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* To'lov modal */}
      {tolovModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
            {/* Modal header with progress info */}
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">To&apos;lov qabul qilish</h3>
                <p className="text-gray-500 dark:text-gray-500 text-sm">{tolovModal.mijoz.ism}</p>
                <div className="flex gap-3 mt-1 text-xs flex-wrap">
                  <span className="text-gray-400">Jami: {formatSum(tolovModal.jamiQarz)}</span>
                  <span className="text-green-600">To&apos;langan: {formatSum(tolovModal.tolangan)}</span>
                  <span className="text-red-600 font-semibold">Qoldiq: {formatSum(tolovModal.qoldiq)}</span>
                </div>
                {/* Progress bar in modal header */}
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <div
                    className="h-1.5 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, (Number(tolovModal.tolangan) / Number(tolovModal.jamiQarz)) * 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setTolovModal(null)}
                className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition shrink-0">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={tolovQilish} className="p-5 space-y-4">
              {/* To'lov summasi with "To'liq to'lash" shortcut */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">To&apos;lov summasi *</label>
                  <button
                    type="button"
                    onClick={() => setTolovForm(f => ({ ...f, summa: String(tolovModal?.qoldiq ?? '') }))}
                    className="text-xs text-green-600 hover:text-green-500 font-medium">
                    To&apos;liq to&apos;lash ({formatSum(tolovModal?.qoldiq ?? 0)})
                  </button>
                </div>
                <MoneyInput
                  value={tolovForm.summa}
                  onChange={v => setTolovForm(f => ({ ...f, summa: v }))}
                  required
                  min={1}
                  max={tolovModal ? Number(tolovModal.qoldiq) : undefined}
                  placeholder="0"
                />
              </div>

              {/* To'lov usuli — toggle buttons instead of select */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-2 block font-medium">To&apos;lov usuli</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'NAQD', label: 'Naqd pul' },
                    { value: 'KARTA', label: 'Bank kartasi' },
                  ].map(u => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setTolovForm(f => ({ ...f, tolovUsuli: u.value }))}
                      className={`py-2 rounded-xl text-sm font-medium border transition ${tolovForm.tolovUsuli === u.value ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Izoh */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input
                  value={tolovForm.izoh}
                  onChange={e => setTolovForm(f => ({ ...f, izoh: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setTolovModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition">
                  To&apos;lovni tasdiqlash
                </button>
              </div>
            </form>

            {/* To'lovlar tarixi */}
            {tolovModal.tolovlar.length > 0 && (
              <div className="px-5 pb-5">
                <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
                  <h4 className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                    <Clock size={14} />
                    To&apos;lovlar tarixi ({tolovModal.tolovlar.length} ta)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tolovModal.tolovlar.map(t => (
                      <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-neutral-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{formatSum(t.summa)}</p>
                          <p className="text-gray-400 dark:text-gray-600 text-xs">
                            {formatSana(t.sana)} • {t.tolovUsuli === 'NAQD' ? 'Naqd' : 'Karta'}
                            {t.izoh && ` • ${t.izoh}`}
                          </p>
                        </div>
                        <span className="text-green-600 text-xs font-medium shrink-0 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-lg">
                          +{formatSum(t.summa)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
