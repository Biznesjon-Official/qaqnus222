'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSana } from '@/lib/utils'
import { toast } from 'sonner'
import { AlertTriangle, PackagePlus, X, History, Layers } from 'lucide-react'
import ViewToggle from '@/components/ViewToggle'
import Combobox from '@/components/ui/combobox'
import MoneyInput from '@/components/ui/money-input'
import SearchBar from '@/components/ui/search-bar'

interface QoldiqItem {
  id: string; nomi: string; kategoriya: { nomi: string }
  birlik: string; sotishNarxi: number; kelishNarxi: number
  minimalQoldiq: number; qoldiq: number; kamQolgan: boolean
}
interface Taminotchi { id: string; nomi: string }
interface OmborHarakat {
  id: string; turi: string; miqdor: number; narx: number
  sana: string; izoh: string | null
  tovar: { nomi: string; birlik: string }
  taminotchi: { nomi: string } | null
  foydalanuvchi: { ism: string }
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

export default function OmborPage() {
  const [qoldiqlar, setQoldiqlar] = useState<QoldiqItem[]>([])
  const [taminotchilar, setTaminotchilar] = useState<Taminotchi[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [modal, setModal] = useState(false)
  const [qidiruv, setQidiruv] = useState('')
  const [kamQolganFilter, setKamQolganFilter] = useState(false)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [form, setForm] = useState({
    tovarId: '', taminotchiId: '', miqdor: '', narx: '', izoh: '', turi: 'KIRIM'
  })
  const [tarix, setTarix] = useState(false)
  const [harakatlar, setHarakatlar] = useState<OmborHarakat[]>([])
  const [harakatYuklanmoqda, setHarakatYuklanmoqda] = useState(false)
  const [harakatTur, setHarakatTur] = useState('')
  const [ommaviyModal, setOmmaviyModal] = useState(false)
  const [ommaviyForm, setOmmaviyForm] = useState({ miqdor: '', izoh: '' })
  const [ommaviyYuklanmoqda, setOmmaviyYuklanmoqda] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('view-preference') as 'table' | 'card' | null
    setView(saved || 'table')
  }, [])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('view-preference', v)
  }

  async function yuklash() {
    setYuklanmoqda(true)
    const [qd, tm] = await Promise.all([
      fetch(`/api/ombor?q=${qidiruv}&kamQolgan=${kamQolganFilter}`).then(r => r.json()),
      fetch('/api/taminotchilar').then(r => r.json()),
    ])
    setQoldiqlar(qd || [])
    setTaminotchilar(tm || [])
    setYuklanmoqda(false)
  }

  useEffect(() => { yuklash() }, [qidiruv, kamQolganFilter])

  async function harakatlarYuklash() {
    setHarakatYuklanmoqda(true)
    const data = await fetch(`/api/ombor/harakatlar?limit=100${harakatTur ? `&tur=${harakatTur}` : ''}`).then(r => r.json())
    setHarakatlar(data || [])
    setHarakatYuklanmoqda(false)
  }

  useEffect(() => {
    if (tarix) harakatlarYuklash()
  }, [tarix, harakatTur])

  async function ommaviyKirim(e: React.FormEvent) {
    e.preventDefault()
    setOmmaviyYuklanmoqda(true)
    const res = await fetch('/api/ombor/ommaviy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ommaviyForm),
    })
    setOmmaviyYuklanmoqda(false)
    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.soni} ta mahsulotga kirim qilindi!`)
      setOmmaviyModal(false)
      setOmmaviyForm({ miqdor: '', izoh: '' })
      yuklash()
      if (tarix) harakatlarYuklash()
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Xatolik yuz berdi')
    }
  }

  async function kirimQilish(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/ombor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success('Tovar qabul qilindi!')
      setModal(false)
      setForm({ tovarId: '', taminotchiId: '', miqdor: '', narx: '', izoh: '', turi: 'KIRIM' })
      yuklash()
      if (tarix) harakatlarYuklash()
    } else {
      toast.error('Xatolik yuz berdi')
    }
  }

  const kamQolganSoni = qoldiqlar.filter(q => q.kamQolgan).length

  // Build combobox options from loaded data
  const tovarOptions = qoldiqlar.map(q => ({ value: q.id, label: q.nomi }))
  const taminotchiOptions = taminotchilar.map(t => ({ value: t.id, label: t.nomi }))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <SearchBar value={qidiruv} onChange={setQidiruv} placeholder="Tovar nomi bo'yicha qidirish..." className="flex-1" />
        <ViewToggle view={view} onChange={changeView} />
        <button
          onClick={() => setKamQolganFilter(!kamQolganFilter)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${kamQolganFilter ? 'bg-red-600 text-white' : 'bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
        >
          <AlertTriangle size={16} />
          Kam qolgan ({kamQolganSoni})
        </button>
        <button
          onClick={() => setTarix(!tarix)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap ${tarix ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
        >
          <History size={16} />
          Harakatlar tarixi
        </button>
        <button onClick={() => setOmmaviyModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <Layers size={16} />
          Ommaviy kirim
        </button>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <PackagePlus size={16} />
          Kirim qilish
        </button>
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Tovar</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Kategoriya</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Qoldiq</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Kelish narxi</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Sotish narxi</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Holati</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : qoldiqlar.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Ma&apos;lumot topilmadi</td></tr>
                ) : qoldiqlar.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${q.kamQolgan ? 'bg-red-50/50 dark:bg-red-950/20' : idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{q.nomi}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium">{q.kategoriya.nomi}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-bold text-sm ${q.kamQolgan ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {q.qoldiq} {q.birlik.toLowerCase()}
                      </span>
                      <p className="text-gray-400 dark:text-gray-600 text-xs">Min: {q.minimalQoldiq}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">
                      {formatSum(q.kelishNarxi)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 text-sm font-medium hidden md:table-cell whitespace-nowrap">
                      {formatSum(q.sotishNarxi)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {q.kamQolgan ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-medium">Kam qoldi</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-lg font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card view */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Yuklanmoqda...</p>
          ) : qoldiqlar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Ma&apos;lumot topilmadi</p>
          ) : qoldiqlar.map(q => (
            <div key={q.id} className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 hover:shadow-md transition-shadow ${q.kamQolgan ? 'border-red-200 dark:border-red-900' : 'border-gray-200 dark:border-neutral-800'}`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">{q.nomi}</p>
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-lg font-medium mt-1 inline-block">{q.kategoriya.nomi}</span>
                </div>
                <div className="shrink-0 ml-2 text-right">
                  {q.kamQolgan ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-medium">Kam qoldi</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-lg font-medium">Normal</span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Qoldiq</p>
                  <p className={`font-bold text-sm ${q.kamQolgan ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>{q.qoldiq} {q.birlik.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Kelish</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{formatSum(q.kelishNarxi)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Sotish</p>
                  <p className="text-green-600 font-semibold text-sm">{formatSum(q.sotishNarxi)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Harakatlar tarixi modal */}
      {tarix && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <h2 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
                <History size={16} className="text-blue-500" />
                Ombor harakatlari tarixi
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {['', 'KIRIM', 'CHIQIM', 'QAYTARISH', 'YOQOTISH'].map(t => (
                  <button
                    key={t}
                    onClick={() => setHarakatTur(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${harakatTur === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                  >
                    {t || 'Barchasi'}
                  </button>
                ))}
                <button onClick={() => setTarix(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition ml-2">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                    <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Sana</th>
                    <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Tovar</th>
                    <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Tur</th>
                    <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Miqdor</th>
                    <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Ta&apos;minotchi</th>
                    <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden lg:table-cell whitespace-nowrap">Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {harakatYuklanmoqda ? (
                    <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                  ) : harakatlar.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Harakatlar topilmadi</td></tr>
                  ) : harakatlar.map((h, idx) => {
                    const turConfig: Record<string, { cls: string; label: string }> = {
                      KIRIM: { cls: 'bg-green-100 text-green-700', label: 'Kirim' },
                      CHIQIM: { cls: 'bg-red-100 text-red-700', label: 'Chiqim' },
                      QAYTARISH: { cls: 'bg-blue-100 text-blue-700', label: 'Qaytarish' },
                      YOQOTISH: { cls: 'bg-orange-100 text-orange-700', label: "Yo'qotish" },
                    }
                    const tc = turConfig[h.turi] || { cls: 'bg-gray-100 text-gray-700', label: h.turi }
                    return (
                      <tr key={h.id} className={`border-b border-gray-100 dark:border-neutral-800 ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-xs whitespace-nowrap">{formatSana(h.sana)}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 text-sm font-medium whitespace-nowrap">{h.tovar.nomi}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${tc.cls}`}>{tc.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 text-sm font-semibold whitespace-nowrap">
                          {(h.turi === 'CHIQIM' || h.turi === 'YOQOTISH') ? '-' : '+'}{h.miqdor} {h.tovar.birlik.toLowerCase()}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden md:table-cell whitespace-nowrap">
                          {h.taminotchi?.nomi || <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-xs hidden lg:table-cell">
                          {h.izoh || <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ommaviy kirim modal */}
      {ommaviyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
                  <Layers size={18} className="text-blue-500" />
                  Ommaviy kirim
                </h3>
                <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
                  {qoldiqlar.length} ta mahsulotga bir xil miqdor qo&apos;shiladi
                </p>
              </div>
              <button onClick={() => setOmmaviyModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={ommaviyKirim} className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-3 text-blue-700 dark:text-blue-300 text-sm">
                Kiritilgan miqdor <strong>barcha {qoldiqlar.length} ta</strong> mahsulotga qo&apos;shiladi
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Miqdor (har biriga) *</label>
                <input
                  type="number"
                  value={ommaviyForm.miqdor}
                  onChange={e => setOmmaviyForm(f => ({ ...f, miqdor: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="100"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input
                  value={ommaviyForm.izoh}
                  onChange={e => setOmmaviyForm(f => ({ ...f, izoh: e.target.value }))}
                  placeholder="Ommaviy kirim"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOmmaviyModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                  Bekor
                </button>
                <button type="submit" disabled={ommaviyYuklanmoqda}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                  <Layers size={15} />
                  {ommaviyYuklanmoqda ? 'Saqlanmoqda...' : `${qoldiqlar.length} ta ga kirim`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kirim modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Tovar kirim qilish</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={kirimQilish} className="p-5 space-y-4">
              {/* Tovar: Combobox with search */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Tovar *</label>
                <Combobox
                  options={tovarOptions}
                  value={form.tovarId}
                  onChange={v => {
                    const t = qoldiqlar.find(q => q.id === v)
                    setForm(f => ({ ...f, tovarId: v, narx: t ? String(t.kelishNarxi) : '' }))
                  }}
                  placeholder="Tovar tanlang"
                  searchPlaceholder="Tovar qidirish..."
                />
              </div>

              {/* Ta'minotchi: Combobox with search */}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Miqdor *</label>
                  <input type="number" value={form.miqdor} onChange={e => setForm(f => ({ ...f, miqdor: e.target.value }))} required min="0" step="0.01" className={inputCls} />
                </div>
                <div>
                  {/* Narx: MoneyInput instead of plain number input */}
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Narx (so&apos;m) *</label>
                  <MoneyInput
                    value={form.narx}
                    onChange={v => setForm(f => ({ ...f, narx: v }))}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input value={form.izoh} onChange={e => setForm(f => ({ ...f, izoh: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                  Bekor
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition">
                  Kirim qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
