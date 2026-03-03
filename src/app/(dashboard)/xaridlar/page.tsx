'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSana } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, X, Trash2, ChevronDown, ChevronUp, ShoppingBag, Banknote, Clock } from 'lucide-react'
import Combobox from '@/components/ui/combobox'
import MoneyInput from '@/components/ui/money-input'
import ViewToggle from '@/components/ViewToggle'

interface XaridTarkibi {
  id: string
  tovarNomi: string
  miqdor: number
  birlikNarxi: number
  jami: number
}

interface XaridTolov {
  id: string
  summa: number
  tolovUsuli: string
  izoh: string | null
  sana: string
}

interface Xarid {
  id: string
  sana: string
  jamiSumma: number
  tolangan: number
  qoldiqQarz: number
  izoh: string | null
  taminotchi: { id: string; nomi: string } | null
  tarkiblar: XaridTarkibi[]
  tolovlar: XaridTolov[]
  foydalanuvchi: { ism: string }
}

interface Taminotchi { id: string; nomi: string }

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

export default function XaridlarPage() {
  const [xaridlar, setXaridlar] = useState<Xarid[]>([])
  const [taminotchilar, setTaminotchilar] = useState<Taminotchi[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [modal, setModal] = useState(false)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [taminotchiFilter, setTaminotchiFilter] = useState('')
  const [danFilter, setDanFilter] = useState('')
  const [gachaFilter, setGachaFilter] = useState('')
  const [kengaytirilgan, setKengaytirilgan] = useState<string | null>(null)
  const [tolovModal, setTolovModal] = useState<Xarid | null>(null)
  const [tolovForm, setTolovForm] = useState({ summa: '', tolovUsuli: 'NAQD', izoh: '' })
  const [tolovSaqlanmoqda, setTolovSaqlanmoqda] = useState(false)

  // Form state
  const [form, setForm] = useState({
    taminotchiId: '',
    tolangan: '',
    izoh: '',
  })
  const [tarkiblar, setTarkiblar] = useState([
    { tovarNomi: '', miqdor: '', birlikNarxi: '' }
  ])
  const [saqlanmoqda, setSaqlanmoqda] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('xaridlar-view') as 'table' | 'card' | null
    setView(saved || 'table')
    fetch('/api/taminotchilar').then(r => r.json()).then(d => setTaminotchilar(d || []))
  }, [])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('xaridlar-view', v)
  }

  async function yuklash() {
    setYuklanmoqda(true)
    const params = new URLSearchParams()
    if (taminotchiFilter) params.set('taminotchiId', taminotchiFilter)
    if (danFilter) params.set('dan', danFilter)
    if (gachaFilter) params.set('gacha', gachaFilter)
    const data = await fetch(`/api/xaridlar?${params}`).then(r => r.json())
    setXaridlar(data || [])
    setYuklanmoqda(false)
  }

  useEffect(() => { yuklash() }, [taminotchiFilter, danFilter, gachaFilter])

  function tarkibQoshish() {
    setTarkiblar(t => [...t, { tovarNomi: '', miqdor: '', birlikNarxi: '' }])
  }

  function tarkibOchirish(idx: number) {
    setTarkiblar(t => t.filter((_, i) => i !== idx))
  }

  function tarkibOzgartirish(idx: number, key: string, value: string) {
    setTarkiblar(t => t.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  const jamiHisob = tarkiblar.reduce(
    (sum, t) => sum + (parseFloat(t.miqdor) || 0) * (parseFloat(t.birlikNarxi) || 0),
    0
  )

  async function xaridSaqlash(e: React.FormEvent) {
    e.preventDefault()
    const validTarkiblar = tarkiblar.filter(t => t.tovarNomi.trim() && parseFloat(t.miqdor) > 0 && parseFloat(t.birlikNarxi) > 0)
    if (validTarkiblar.length === 0) {
      toast.error('Kamida bitta to\'liq tovar kiriting')
      return
    }
    setSaqlanmoqda(true)
    try {
      const res = await fetch('/api/xaridlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taminotchiId: form.taminotchiId || null,
          tolangan: form.tolangan,
          izoh: form.izoh,
          tarkiblar: validTarkiblar.map(t => ({
            tovarNomi: t.tovarNomi,
            miqdor: parseFloat(t.miqdor),
            birlikNarxi: parseFloat(t.birlikNarxi),
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.xato || 'Xatolik'); return }
      toast.success('Xarid qayd etildi!')
      setModal(false)
      setForm({ taminotchiId: '', tolangan: '', izoh: '' })
      setTarkiblar([{ tovarNomi: '', miqdor: '', birlikNarxi: '' }])
      yuklash()
    } finally {
      setSaqlanmoqda(false)
    }
  }

  function openTolovModal(x: Xarid) {
    setTolovModal(x)
    setTolovForm({ summa: String(x.qoldiqQarz), tolovUsuli: 'NAQD', izoh: '' })
  }

  async function tolovQilish(e: React.FormEvent) {
    e.preventDefault()
    if (!tolovModal) return
    setTolovSaqlanmoqda(true)
    try {
      const res = await fetch(`/api/xaridlar/${tolovModal.id}/tolov`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tolovForm)
      })
      if (res.ok) {
        toast.success("To'lov qabul qilindi!")
        setTolovModal(null)
        yuklash()
      } else toast.error('Xatolik yuz berdi')
    } finally {
      setTolovSaqlanmoqda(false)
    }
  }

  const taminotchiOptions = taminotchilar.map(t => ({ value: t.id, label: t.nomi }))
  const taminotchiFilterOptions = [
    { value: '', label: 'Barcha ta\'minotchilar' },
    ...taminotchiOptions,
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={taminotchiFilter}
          onChange={e => setTaminotchiFilter(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
        >
          {taminotchiFilterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={danFilter}
          onChange={e => setDanFilter(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          placeholder="Dan"
        />
        <input
          type="date"
          value={gachaFilter}
          onChange={e => setGachaFilter(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          placeholder="Gacha"
        />
        <div className="flex gap-2 sm:ml-auto">
          <ViewToggle view={view} onChange={changeView} />
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap"
          >
            <Plus size={16} />
            Yangi xarid
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Sana</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Ta&apos;minotchi</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Tovarlar</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Jami summa</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">To&apos;langan</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Qoldiq qarz</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : xaridlar.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Xaridlar topilmadi</td></tr>
                ) : xaridlar.map((x, idx) => (
                  <>
                    <tr
                      key={x.id}
                      className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-sm whitespace-nowrap">{formatSana(x.sana)}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 text-sm font-medium whitespace-nowrap">
                        {x.taminotchi?.nomi || <span className="text-gray-400 dark:text-gray-600 italic">Noma&apos;lum</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-lg">
                          {x.tarkiblar.length} ta
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold text-sm whitespace-nowrap">{formatSum(x.jamiSumma)}</td>
                      <td className="px-4 py-3 text-right text-green-600 text-sm hidden md:table-cell whitespace-nowrap">{formatSum(x.tolangan)}</td>
                      <td className={`px-4 py-3 text-right font-semibold text-sm whitespace-nowrap ${x.qoldiqQarz > 0 ? 'text-red-600' : 'text-gray-400 dark:text-gray-600'}`}>
                        {x.qoldiqQarz > 0 ? formatSum(x.qoldiqQarz) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {x.qoldiqQarz > 0 && (
                            <button
                              onClick={() => openTolovModal(x)}
                              className="p-1.5 text-green-600 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition"
                              title="Qarz to'lash"
                            >
                              <Banknote size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setKengaytirilgan(kengaytirilgan === x.id ? null : x.id)}
                            className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                          >
                            {kengaytirilgan === x.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {kengaytirilgan === x.id && (
                      <tr key={`${x.id}-detail`} className="bg-gray-50 dark:bg-neutral-800/60">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="space-y-1.5">
                            {x.tarkiblar.map(t => (
                              <div key={t.id} className="flex items-center justify-between text-sm gap-4">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">{t.tovarNomi}</span>
                                <span className="text-gray-500 dark:text-gray-500 text-xs">{t.miqdor} dona × {formatSum(t.birlikNarxi)}</span>
                                <span className="text-gray-900 dark:text-gray-100 font-semibold">{formatSum(t.jami)}</span>
                              </div>
                            ))}
                            {x.izoh && <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">Izoh: {x.izoh}</p>}
                            {x.tolovlar && x.tolovlar.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-neutral-700">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1"><Clock size={12} /> To&apos;lovlar tarixi</p>
                                {x.tolovlar.map(t => (
                                  <div key={t.id} className="flex items-center justify-between text-sm gap-4">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">{formatSana(t.sana)}</span>
                                    <span className="text-xs text-gray-400">{t.tolovUsuli === 'NAQD' ? 'Naqd' : 'Karta'}</span>
                                    {t.izoh && <span className="text-gray-400 text-xs flex-1 truncate">{t.izoh}</span>}
                                    <span className="text-green-600 font-semibold">{formatSum(t.summa)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Yuklanmoqda...</p>
          ) : xaridlar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Xaridlar topilmadi</p>
          ) : xaridlar.map(x => (
            <div key={x.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                    {x.taminotchi?.nomi || <span className="text-gray-400 italic">Noma&apos;lum ta&apos;minotchi</span>}
                  </p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">{formatSana(x.sana)}</p>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-lg shrink-0">
                  {x.tarkiblar.length} tovar
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Jami</p>
                  <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{formatSum(x.jamiSumma)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">To&apos;langan</p>
                  <p className="text-green-600 font-medium text-sm">{formatSum(x.tolangan)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Qarz</p>
                  <p className={`font-semibold text-sm ${x.qoldiqQarz > 0 ? 'text-red-600' : 'text-gray-400 dark:text-gray-600'}`}>
                    {x.qoldiqQarz > 0 ? formatSum(x.qoldiqQarz) : '—'}
                  </p>
                </div>
              </div>

              {/* Tarkiblar */}
              <div className="mt-3 space-y-1">
                {x.tarkiblar.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{t.tovarNomi}</span>
                    <span className="text-gray-400 dark:text-gray-600 shrink-0 ml-2">{t.miqdor} × {formatSum(t.birlikNarxi)}</span>
                  </div>
                ))}
                {x.tarkiblar.length > 3 && (
                  <p className="text-gray-400 dark:text-gray-600 text-xs">+{x.tarkiblar.length - 3} ta boshqa tovar</p>
                )}
              </div>
              {x.izoh && <p className="text-gray-400 dark:text-gray-600 text-xs mt-2 italic">{x.izoh}</p>}
              {x.qoldiqQarz > 0 && (
                <button
                  onClick={() => openTolovModal(x)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-green-50 dark:bg-green-950/30 text-green-600 rounded-xl text-xs font-medium hover:bg-green-100 dark:hover:bg-green-950/50 transition"
                >
                  <Banknote size={14} />
                  Qarz to&apos;lash
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Qarz to'lash modal */}
      {tolovModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-green-600" />
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Qarz to&apos;lash</h3>
              </div>
              <button onClick={() => setTolovModal(null)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={tolovQilish} className="p-5 space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Ta&apos;minotchi: <span className="font-medium text-gray-900 dark:text-gray-100">{tolovModal.taminotchi?.nomi || "Noma'lum"}</span></p>
                <p>Qoldiq qarz: <span className="font-bold text-red-600">{formatSum(tolovModal.qoldiqQarz)}</span></p>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">To&apos;lov summasi *</label>
                <MoneyInput
                  value={tolovForm.summa}
                  onChange={v => setTolovForm(f => ({ ...f, summa: v }))}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">To&apos;lov usuli</label>
                <select
                  value={tolovForm.tolovUsuli}
                  onChange={e => setTolovForm(f => ({ ...f, tolovUsuli: e.target.value }))}
                  className={inputCls}
                >
                  <option value="NAQD">Naqd</option>
                  <option value="KARTA">Karta</option>
                </select>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input
                  value={tolovForm.izoh}
                  onChange={e => setTolovForm(f => ({ ...f, izoh: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTolovModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={tolovSaqlanmoqda}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition"
                >
                  {tolovSaqlanmoqda ? "Saqlanmoqda..." : "To'lovni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yangi xarid modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-red-600" />
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Yangi xarid qayd etish</h3>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={xaridSaqlash} className="p-5 space-y-4">
              {/* Ta'minotchi */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Ta&apos;minotchi</label>
                <Combobox
                  options={taminotchiOptions}
                  value={form.taminotchiId}
                  onChange={v => setForm(f => ({ ...f, taminotchiId: v }))}
                  placeholder="Ta'minotchi tanlang (ixtiyoriy)"
                  searchPlaceholder="Ta'minotchi qidirish..."
                />
              </div>

              {/* Tovarlar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Tovarlar *</label>
                  <button type="button" onClick={tarkibQoshish} className="text-xs text-red-600 hover:text-red-500 font-medium flex items-center gap-1">
                    <Plus size={13} />
                    Tovar qo&apos;shish
                  </button>
                </div>
                <div className="space-y-2">
                  {tarkiblar.map((t, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={t.tovarNomi}
                          onChange={e => tarkibOzgartirish(idx, 'tovarNomi', e.target.value)}
                          placeholder="Tovar nomi"
                          required={idx === 0}
                          className={inputCls + ' text-sm'}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={t.miqdor}
                          onChange={e => tarkibOzgartirish(idx, 'miqdor', e.target.value)}
                          placeholder="Miqdor"
                          min="0.01"
                          step="0.01"
                          required={idx === 0}
                          className={inputCls + ' text-sm'}
                        />
                      </div>
                      <div className="w-32">
                        <MoneyInput
                          value={t.birlikNarxi}
                          onChange={v => tarkibOzgartirish(idx, 'birlikNarxi', v)}
                          placeholder="Narx"
                          required={idx === 0}
                        />
                      </div>
                      {tarkiblar.length > 1 && (
                        <button type="button" onClick={() => tarkibOchirish(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition mt-0.5">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {jamiHisob > 0 && (
                  <p className="text-right text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Jami: <span className="font-bold text-gray-900 dark:text-gray-100">{formatSum(jamiHisob)}</span>
                  </p>
                )}
              </div>

              {/* To'langan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">To&apos;langan summa</label>
                  {jamiHisob > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tolangan: String(jamiHisob) }))}
                      className="text-xs text-green-600 hover:text-green-500 font-medium"
                    >
                      To&apos;liq to&apos;lash
                    </button>
                  )}
                </div>
                <MoneyInput
                  value={form.tolangan}
                  onChange={v => setForm(f => ({ ...f, tolangan: v }))}
                  placeholder="0"
                />
                {jamiHisob > 0 && parseFloat(form.tolangan || '0') < jamiHisob && (
                  <p className="text-xs text-amber-600 mt-1">
                    Qoldiq qarz: {formatSum(jamiHisob - parseFloat(form.tolangan || '0'))}
                  </p>
                )}
              </div>

              {/* Izoh */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input
                  value={form.izoh}
                  onChange={e => setForm(f => ({ ...f, izoh: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  className={inputCls}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={saqlanmoqda}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition"
                >
                  {saqlanmoqda ? 'Saqlanmoqda...' : 'Xaridni saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
