'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'
import { UserPlus, Phone, MapPin, X, Hash, Trash2 } from 'lucide-react'
import ViewToggle from '@/components/ViewToggle'
import PhoneInput from '@/components/ui/phone-input'
import SearchBar from '@/components/ui/search-bar'

interface Mijoz {
  id: string; ism: string; telefon: string | null; manzil: string | null
  maxsus_kod: string | null
  _count: { sotuvlar: number; nasiyalar: number }; jami_qarz: number
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'

export default function MijozlarPage() {
  const [mijozlar, setMijozlar] = useState<Mijoz[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [qidiruv, setQidiruv] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ism: '', telefon: '', manzil: '', izoh: '' })
  const [view, setView] = useState<'table' | 'card'>('table')

  async function yuklash() {
    setYuklanmoqda(true)
    const data = await fetch(`/api/mijozlar?q=${qidiruv}`).then(r => r.json())
    setMijozlar(data || [])
    setYuklanmoqda(false)
  }

  useEffect(() => {
    // Restore saved view preference from localStorage
    const saved = localStorage.getItem('mijozlar-view')
    if (saved === 'table' || saved === 'card') setView(saved)
  }, [])

  useEffect(() => { yuklash() }, [qidiruv])

  function changeView(v: 'table' | 'card') {
    setView(v)
    localStorage.setItem('mijozlar-view', v)
  }

  async function ochirish(m: Mijoz) {
    if (!confirm(`"${m.ism}" mijozni o'chirasizmi?`)) return
    const res = await fetch(`/api/mijozlar/${m.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { toast.success("Mijoz o'chirildi"); yuklash() }
    else toast.error(data.xato || "O'chirishda xatolik")
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/mijozlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success("Mijoz qo'shildi")
      setModal(false)
      setForm({ ism: '', telefon: '', manzil: '', izoh: '' })
      yuklash()
    } else toast.error('Xatolik yuz berdi')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={qidiruv}
          onChange={setQidiruv}
          placeholder="Ism yoki telefon raqam bo'yicha qidirish..."
          className="flex-1"
        />
        {/* View toggle placed between search and add button */}
        <ViewToggle view={view} onChange={changeView} />
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <UserPlus size={16} />
          Mijoz qo&apos;shish
        </button>
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Ism</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden lg:table-cell whitespace-nowrap">Kod</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Telefon</th>
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell whitespace-nowrap">Manzil</th>
                  <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Jami sotuv</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Qarz</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Amal</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : mijozlar.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 dark:text-gray-600 py-12">Mijozlar topilmadi</td></tr>
                ) : mijozlar.map((m, idx) => (
                  <tr key={m.id} className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}>
                    {/* Ism with avatar */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                          {m.ism[0]?.toUpperCase()}
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">{m.ism}</span>
                      </div>
                    </td>
                    {/* Maxsus kod */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden lg:table-cell whitespace-nowrap">
                      {m.maxsus_kod ? (
                        <span className="flex items-center gap-1 font-mono text-xs bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg">
                          <Hash size={10} />{m.maxsus_kod}
                        </span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Telefon */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm hidden sm:table-cell whitespace-nowrap">
                      {m.telefon ? (
                        <span className="flex items-center gap-1"><Phone size={12} />{formatPhone(m.telefon)}</span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Manzil */}
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-600 text-sm hidden md:table-cell whitespace-nowrap">
                      {m.manzil ? (
                        <span className="flex items-center gap-1"><MapPin size={12} />{m.manzil}</span>
                      ) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>
                    {/* Jami sotuv */}
                    <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100 font-medium text-sm whitespace-nowrap">
                      {m._count.sotuvlar} ta
                    </td>
                    {/* Qarz */}
                    <td className="px-4 py-3 text-right font-semibold text-sm whitespace-nowrap">
                      <span className={m.jami_qarz > 0 ? 'text-red-600' : 'text-green-600'}>
                        {m.jami_qarz > 0 ? formatSum(m.jami_qarz) : "Yo'q"}
                      </span>
                    </td>
                    {/* Amal */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => ochirish(m)}
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
          ) : mijozlar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Mijozlar topilmadi</p>
          ) : mijozlar.map(m => (
            <div key={m.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">{m.ism}</p>
                    <button
                      onClick={() => ochirish(m)}
                      className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition shrink-0"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Clickable phone link */}
                  {m.telefon && (
                    <a href={`tel:+998${m.telefon}`} className="text-gray-500 dark:text-gray-500 text-sm flex items-center gap-1 hover:text-blue-600">
                      <Phone size={12} /> {formatPhone(m.telefon)}
                    </a>
                  )}
                  {m.manzil && (
                    <p className="text-gray-400 dark:text-gray-600 text-sm flex items-center gap-1">
                      <MapPin size={12} /> {m.manzil}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-bold text-lg shrink-0 ml-2">
                  {m.ism[0]?.toUpperCase()}
                </div>
              </div>
              {m.maxsus_kod && (
                <p className="mt-1.5 text-xs font-mono text-gray-400 dark:text-gray-600 flex items-center gap-1">
                  <Hash size={10} />{m.maxsus_kod}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Jami sotuv</p>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{m._count.sotuvlar} ta</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Qarz</p>
                  <p className={`font-semibold ${m.jami_qarz > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {m.jami_qarz > 0 ? formatSum(m.jami_qarz) : "Yo'q"}
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
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Yangi mijoz</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saqlash} className="p-5 space-y-4">
              {/* Ism field */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Ism *</label>
                <input type="text" required
                  value={form.ism}
                  onChange={e => setForm(prev => ({ ...prev, ism: e.target.value }))}
                  className={inputCls} />
              </div>
              {/* Telefon — PhoneInput component */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Telefon</label>
                <PhoneInput
                  value={form.telefon}
                  onChange={v => setForm(f => ({ ...f, telefon: v }))}
                  placeholder="+998 (__) ___-__-__"
                />
              </div>
              {/* Manzil field */}
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Manzil</label>
                <input type="text"
                  value={form.manzil}
                  onChange={e => setForm(prev => ({ ...prev, manzil: e.target.value }))}
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
