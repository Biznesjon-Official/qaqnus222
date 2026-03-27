'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Phone, MapPin, User, Truck, X, Trash2 } from 'lucide-react'
import ViewToggle from '@/components/ViewToggle'
import PhoneInput from '@/components/ui/phone-input'
import SearchBar from '@/components/ui/search-bar'

interface Taminotchi {
  id: string; nomi: string; kontaktShaxs: string | null
  telefon: string | null; manzil: string | null; jamiQarz: number
  _count: { xaridlar: number }
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

export default function TaminotchilarPage() {
  const [taminotchilar, setTaminotchilar] = useState<Taminotchi[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nomi: '', kontaktShaxs: '', telefon: '', manzil: '', izoh: '' })
  const [view, setView] = useState<'table' | 'card'>('table')
  const [qidiruv, setQidiruv] = useState('')
  const [qarzFilter, setQarzFilter] = useState<'barchasi' | 'qarzli' | 'qarzsiz'>('barchasi')

  async function yuklash() {
    setYuklanmoqda(true)
    const data = await fetch('/api/taminotchilar').then(r => r.json())
    setTaminotchilar(data || [])
    setYuklanmoqda(false)
  }

  useEffect(() => {
    // Restore saved view preference from localStorage
    const saved = localStorage.getItem('taminotchilar-view')
    if (saved === 'table' || saved === 'card') setView(saved)
    yuklash()
  }, [])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('taminotchilar-view', v)
  }

  async function ochirish(t: Taminotchi) {
    if (!confirm(`"${t.nomi}" ta'minotchini o'chirasizmi?`)) return
    const res = await fetch(`/api/taminotchilar/${t.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { toast.success("Ta'minotchi o'chirildi"); yuklash() }
    else toast.error(data.xato || "O'chirishda xatolik")
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/taminotchilar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success("Ta'minotchi qo'shildi")
      setModal(false)
      setForm({ nomi: '', kontaktShaxs: '', telefon: '', manzil: '', izoh: '' })
      yuklash()
    } else toast.error('Xatolik yuz berdi')
  }

  // Client-side filtering by search query and debt status
  const filtered = taminotchilar.filter(t => {
    const matchSearch = !qidiruv ||
      t.nomi.toLowerCase().includes(qidiruv.toLowerCase()) ||
      (t.kontaktShaxs?.toLowerCase().includes(qidiruv.toLowerCase())) ||
      (t.telefon?.includes(qidiruv))
    const matchQarz = qarzFilter === 'barchasi' ||
      (qarzFilter === 'qarzli' && t.jamiQarz > 0) ||
      (qarzFilter === 'qarzsiz' && t.jamiQarz <= 0)
    return matchSearch && matchQarz
  })

  return (
    <div className="space-y-4">
      <SearchBar
        value={qidiruv}
        onChange={setQidiruv}
        placeholder="Nomi, kontakt shaxs, telefon bo'yicha qidirish..."
        debounceMs={0}
      />

      {/* Qarz holati filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: 'barchasi', label: 'Barchasi' },
          { value: 'qarzli', label: 'Qarzlilar' },
          { value: 'qarzsiz', label: 'Qarzsizlar' },
        ].map(f => (
          <button key={f.value} onClick={() => setQarzFilter(f.value as 'barchasi' | 'qarzli' | 'qarzsiz')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${qarzFilter === f.value ? 'bg-red-600 text-white' : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Toolbar: ViewToggle + add button */}
      <div className="flex justify-between items-center gap-3">
        {/* View toggle on the left side of the toolbar */}
        <ViewToggle view={view} onChange={changeView} />
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">
          <Plus size={16} />
          Ta&apos;minotchi qo&apos;shish
        </button>
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Kompaniya</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Kontakt shaxs</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Telefon</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Manzil</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Xaridlar</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Qarz</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Amal</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Hech narsa topilmadi</td></tr>
                ) : filtered.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                    {/* Kompaniya with truck icon */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                          <Truck size={13} />
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">{t.nomi}</span>
                      </div>
                    </td>
                    {/* Kontakt shaxs */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden sm:table-cell whitespace-nowrap">
                      {t.kontaktShaxs ? (
                        <span className="flex items-center gap-1"><User size={12} />{t.kontaktShaxs}</span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Telefon */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden sm:table-cell whitespace-nowrap">
                      {t.telefon ? (
                        <span className="flex items-center gap-1"><Phone size={12} />{formatPhone(t.telefon)}</span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Manzil */}
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">
                      {t.manzil ? (
                        <span className="flex items-center gap-1"><MapPin size={12} />{t.manzil}</span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Xaridlar */}
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100 font-medium text-sm whitespace-nowrap">
                      {t._count.xaridlar} ta
                    </td>
                    {/* Qarz */}
                    <td className="px-4 py-3 text-right font-semibold text-sm whitespace-nowrap">
                      <span className={t.jamiQarz > 0 ? 'text-red-600' : 'text-green-600'}>
                        {t.jamiQarz > 0 ? formatSum(t.jamiQarz) : "Yo'q"}
                      </span>
                    </td>
                    {/* Amal */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => ochirish(t)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Yuklanmoqda...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Hech narsa topilmadi</p>
          ) : filtered.map(t => (
            <div key={t.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">{t.nomi}</p>
                    <button
                      onClick={() => ochirish(t)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition shrink-0"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {t.kontaktShaxs && (
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                      <User size={12} /> {t.kontaktShaxs}
                    </p>
                  )}
                  {/* Clickable phone link */}
                  {t.telefon && (
                    <a href={`tel:+998${t.telefon}`} className="text-gray-500 dark:text-gray-500 text-sm flex items-center gap-1 hover:text-blue-600">
                      <Phone size={12} /> {formatPhone(t.telefon)}
                    </a>
                  )}
                  {t.manzil && (
                    <p className="text-gray-400 dark:text-gray-600 text-sm flex items-center gap-1">
                      <MapPin size={12} /> {t.manzil}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0 ml-2">
                  <Truck size={18} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Xaridlar</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{t._count.xaridlar} ta</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Qarz</p>
                  <p className={`font-semibold ${t.jamiQarz > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {t.jamiQarz > 0 ? formatSum(t.jamiQarz) : "Yo'q"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Yangi ta&apos;minotchi</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saqlash} className="p-5 space-y-4">
              {/* Kompaniya nomi */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Kompaniya nomi *</label>
                <input required value={form.nomi}
                  onChange={e => setForm(p => ({ ...p, nomi: e.target.value }))}
                  className={inputCls} />
              </div>
              {/* Kontakt shaxs */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Kontakt shaxs</label>
                <input value={form.kontaktShaxs}
                  onChange={e => setForm(p => ({ ...p, kontaktShaxs: e.target.value }))}
                  className={inputCls} />
              </div>
              {/* Telefon — PhoneInput component */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Telefon</label>
                <PhoneInput
                  value={form.telefon}
                  onChange={v => setForm(p => ({ ...p, telefon: v }))}
                />
              </div>
              {/* Manzil */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Manzil</label>
                <input value={form.manzil}
                  onChange={e => setForm(p => ({ ...p, manzil: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">Qo&apos;shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
