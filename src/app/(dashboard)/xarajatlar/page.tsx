'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSana } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, X, Home, Users, Car, Zap, FileText } from 'lucide-react'
import ViewToggle from '@/components/ViewToggle'
import Combobox from '@/components/ui/combobox'
import MoneyInput from '@/components/ui/money-input'
import SearchBar from '@/components/ui/search-bar'

interface Xarajat {
  id: string; kategoriya: string; summa: number; izoh: string | null
  sana: string; foydalanuvchi: { ism: string }
}

const KATEGORIYALAR = ['IJARA', 'MAOSH', 'TRANSPORT', 'KOMMUNAL', 'BOSHQA']
const KAT_ICONS: Record<string, React.ElementType> = {
  IJARA: Home, MAOSH: Users, TRANSPORT: Car, KOMMUNAL: Zap, BOSHQA: FileText
}
const KAT_COLORS: Record<string, string> = {
  IJARA: 'bg-blue-100 text-blue-600', MAOSH: 'bg-purple-100 text-purple-600',
  TRANSPORT: 'bg-amber-100 text-amber-600', KOMMUNAL: 'bg-yellow-100 text-yellow-600',
  BOSHQA: 'bg-gray-100 text-gray-600'
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

// Combobox options for kategoriya
const katOptions = KATEGORIYALAR.map(k => ({
  value: k,
  label: k.charAt(0) + k.slice(1).toLowerCase()
}))

export default function XarajatlarPage() {
  const [xarajatlar, setXarajatlar] = useState<Xarajat[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [modal, setModal] = useState(false)
  const [filterKat, setFilterKat] = useState('')
  const [qidiruv, setQidiruv] = useState('')
  const [view, setView] = useState<'table' | 'card'>('table')
  const [form, setForm] = useState({
    kategoriya: 'IJARA', summa: '', izoh: '',
    sana: new Date().toISOString().split('T')[0]
  })

  async function yuklash() {
    setYuklanmoqda(true)
    const data = await fetch(`/api/xarajatlar${filterKat ? `?kategoriya=${filterKat}` : ''}`).then(r => r.json())
    setXarajatlar(data || [])
    setYuklanmoqda(false)
  }

  useEffect(() => {
    // Restore saved view preference from localStorage
    const saved = localStorage.getItem('xarajatlar-view')
    if (saved === 'table' || saved === 'card') setView(saved)
  }, [])

  useEffect(() => { yuklash() }, [filterKat])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('xarajatlar-view', v)
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/xarajatlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success('Xarajat kiritildi')
      setModal(false)
      setForm({ kategoriya: 'IJARA', summa: '', izoh: '', sana: new Date().toISOString().split('T')[0] })
      yuklash()
    } else toast.error('Xatolik yuz berdi')
  }

  // Total of filtered list from server (all items matching category filter)
  const jamiXarajat = xarajatlar.reduce((s, x) => s + Number(x.summa), 0)

  // Current month stats (computed from all fetched xarajatlar, regardless of category filter)
  const buOy = new Date()
  const buOyXarajatlar = xarajatlar.filter(x => {
    const d = new Date(x.sana)
    return d.getMonth() === buOy.getMonth() && d.getFullYear() === buOy.getFullYear()
  })
  const buOyJami = buOyXarajatlar.reduce((s, x) => s + Number(x.summa), 0)

  // Category breakdown for biggest category card
  const katBreakdown = KATEGORIYALAR.reduce((acc, k) => {
    acc[k] = xarajatlar.filter(x => x.kategoriya === k).reduce((s, x) => s + Number(x.summa), 0)
    return acc
  }, {} as Record<string, number>)
  const engKattaKat = Object.entries(katBreakdown).sort((a, b) => b[1] - a[1])[0]

  // Client-side search filter: filter by izoh or kategoriya text
  const displayXarajatlar = xarajatlar.filter(x =>
    !qidiruv ||
    x.izoh?.toLowerCase().includes(qidiruv.toLowerCase()) ||
    x.kategoriya.toLowerCase().includes(qidiruv.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {['', ...KATEGORIYALAR].map(k => {
            const Icon = k ? KAT_ICONS[k] : null
            return (
              <button key={k} onClick={() => setFilterKat(k)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${filterKat === k ? 'bg-red-600 text-white' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
                {Icon && <Icon size={13} />}
                {k ? k.toLowerCase() : 'Barchasi'}
              </button>
            )
          })}
        </div>
        {/* View toggle placed between filters and add button */}
        <ViewToggle view={view} onChange={changeView} />
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <Plus size={16} />
          Xarajat kiritish
        </button>
      </div>

      <SearchBar
        value={qidiruv}
        onChange={setQidiruv}
        placeholder="Izoh yoki kategoriya bo'yicha qidirish..."
        debounceMs={0}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs font-medium">Bu oydagi xarajat</p>
          <p className="text-red-600 font-bold text-xl mt-1">{formatSum(buOyJami)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs font-medium">Jami (filtr bo&apos;yicha)</p>
          <p className="text-red-600 font-bold text-xl mt-1">{formatSum(jamiXarajat)}</p>
        </div>
        {engKattaKat && engKattaKat[1] > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
            <p className="text-gray-500 dark:text-gray-500 text-xs font-medium">Eng katta kategoriya</p>
            <p className="text-gray-900 dark:text-gray-100 font-bold text-xl mt-1 capitalize">{engKattaKat[0].toLowerCase()}</p>
            <p className="text-gray-400 text-xs">{formatSum(engKattaKat[1])}</p>
          </div>
        )}
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Kategoriya</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Izoh</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Summa</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Sana</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : displayXarajatlar.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400 dark:text-gray-600 py-12">Xarajatlar topilmadi</td></tr>
                ) : displayXarajatlar.map((x, idx) => {
                  const Icon = KAT_ICONS[x.kategoriya] || FileText
                  return (
                    <tr key={x.id} className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${KAT_COLORS[x.kategoriya] || 'bg-gray-100 text-gray-500'}`}>
                            <Icon size={13} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{x.kategoriya.toLowerCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-sm hidden sm:table-cell whitespace-nowrap">{x.izoh || '-'}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold whitespace-nowrap">{formatSum(x.summa)}</td>
                      <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">{formatSana(x.sana)}</td>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Yuklanmoqda...</p>
          ) : displayXarajatlar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Xarajatlar topilmadi</p>
          ) : displayXarajatlar.map(x => {
            const Icon = KAT_ICONS[x.kategoriya] || FileText
            return (
              <div key={x.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  {/* Category icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${KAT_COLORS[x.kategoriya] || 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={18} />
                  </div>
                  {/* Amount */}
                  <p className="text-red-600 font-bold text-lg">{formatSum(x.summa)}</p>
                </div>
                {/* Category label */}
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm mt-3 capitalize">
                  {x.kategoriya.toLowerCase()}
                </p>
                {/* Date */}
                <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">{formatSana(x.sana)}</p>
                {/* Note */}
                {x.izoh && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 border-t border-gray-100 dark:border-neutral-800 pt-2 line-clamp-2">
                    {x.izoh}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add xarajat modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Xarajat kiritish</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saqlash} className="p-5 space-y-4">
              {/* Kategoriya — Combobox with search */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Kategoriya</label>
                <Combobox
                  options={katOptions}
                  value={form.kategoriya}
                  onChange={v => setForm(f => ({ ...f, kategoriya: v || 'IJARA' }))}
                  placeholder="Kategoriya tanlang"
                />
              </div>
              {/* Summa — MoneyInput */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Summa (so&apos;m) *</label>
                <MoneyInput
                  value={form.summa}
                  onChange={v => setForm(f => ({ ...f, summa: v }))}
                  required
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh</label>
                <input value={form.izoh} onChange={e => setForm(f => ({ ...f, izoh: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Sana</label>
                <input type="date" value={form.sana} onChange={e => setForm(f => ({ ...f, sana: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">Kiritish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
