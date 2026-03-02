'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, X, ArrowLeft, PackagePlus, PackageCheck,
  Phone, ChevronRight, AlertCircle, CheckCircle2, Clock
} from 'lucide-react'
import SearchBar from '@/components/ui/search-bar'

interface Sherik {
  id: string; ism: string; telefon: string | null; telefon2: string | null
  manzil: string | null; tavsif: string | null; yaratilgan: string
  ochiqQarzlar: number
}

interface SherikQarzTarkibi {
  id: string; tovarNomi: string; miqdor: number; birlik: string; qaytarilgan: number
}

interface SherikQarz {
  id: string; sherikId: string; izoh: string | null
  holati: 'OCHIQ' | 'QISMAN' | 'YOPILGAN'; yaratilgan: string
  tarkiblar: SherikQarzTarkibi[]
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm'
const selectCls = inputCls

function fmt(n: number) { return n % 1 === 0 ? String(n) : n.toFixed(2) }

function HolatBadge({ holat }: { holat: string }) {
  if (holat === 'YOPILGAN') return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> Qaytarildi
    </span>
  )
  if (holat === 'QISMAN') return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
      <Clock size={11} /> Qisman
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
      <AlertCircle size={11} /> Kutmoqda
    </span>
  )
}

export default function SheriklamPage() {
  // ─── Sheriklar list ───
  const [sheriklar, setSheriklar] = useState<Sherik[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [qidiruv, setQidiruv] = useState('')

  // ─── Sherik CRUD modals ───
  const [sherikModal, setSherikModal] = useState(false)
  const [tahrirlash, setTahrirlash] = useState<Sherik | null>(null)
  const [sherikForm, setSherikForm] = useState({ ism: '', telefon: '', telefon2: '', manzil: '', tavsif: '' })

  // ─── Detail view ───
  const [tanlanganSherik, setTanlanganSherik] = useState<Sherik | null>(null)
  const [qarzlar, setQarzlar] = useState<SherikQarz[]>([])
  const [qarzYuklanmoqda, setQarzYuklanmoqda] = useState(false)

  // ─── Berish modal ───
  const [berishModal, setBerishModal] = useState(false)
  const [berishIzoh, setBerishIzoh] = useState('')
  const [berishTarkiblar, setBerishTarkiblar] = useState([{ tovarNomi: '', miqdor: '', birlik: 'dona' }])
  const [berishYuklanmoqda, setBerishYuklanmoqda] = useState(false)

  // ─── Qaytarish modal ───
  const [qaytarishQarz, setQaytarishQarz] = useState<SherikQarz | null>(null)
  const [qaytarishMiqdorlar, setQaytarishMiqdorlar] = useState<Record<string, string>>({})
  const [qaytarishYuklanmoqda, setQaytarishYuklanmoqda] = useState(false)

  // ────────────────────────────────────────
  async function sherikYuklash() {
    setYuklanmoqda(true)
    const res = await fetch(`/api/sheriklar?q=${qidiruv}`)
    setSheriklar(await res.json())
    setYuklanmoqda(false)
  }

  useEffect(() => { sherikYuklash() }, [qidiruv])

  async function qarzlarYuklash(sherik: Sherik) {
    setQarzYuklanmoqda(true)
    const res = await fetch(`/api/sherik-qarzlar?sherikId=${sherik.id}`)
    setQarzlar(await res.json())
    setQarzYuklanmoqda(false)
  }

  function sherikTanlash(s: Sherik) {
    setTanlanganSherik(s)
    setQarzlar([])
    qarzlarYuklash(s)
  }

  function orqaga() {
    setTanlanganSherik(null)
    setQarzlar([])
    sherikYuklash()
  }

  // ─── Sherik CRUD ───
  function ochSherikModal(sherik?: Sherik) {
    if (sherik) {
      setTahrirlash(sherik)
      setSherikForm({ ism: sherik.ism, telefon: sherik.telefon || '', telefon2: sherik.telefon2 || '', manzil: sherik.manzil || '', tavsif: sherik.tavsif || '' })
    } else {
      setTahrirlash(null)
      setSherikForm({ ism: '', telefon: '', telefon2: '', manzil: '', tavsif: '' })
    }
    setSherikModal(true)
  }

  async function sherikSaqlash(e: React.FormEvent) {
    e.preventDefault()
    const url = tahrirlash ? `/api/sheriklar/${tahrirlash.id}` : '/api/sheriklar'
    const method = tahrirlash ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sherikForm) })
    if (res.ok) {
      toast.success(tahrirlash ? 'Sherik yangilandi' : "Sherik qo'shildi")
      setSherikModal(false)
      sherikYuklash()
      if (tanlanganSherik && tahrirlash?.id === tanlanganSherik.id) {
        const updated = await res.json()
        setTanlanganSherik({ ...tanlanganSherik, ...updated })
      }
    } else toast.error('Xatolik yuz berdi')
  }

  async function sherikOchirish(s: Sherik) {
    if (!confirm(`"${s.ism}" ni o'chirishni tasdiqlaysizmi?`)) return
    const res = await fetch(`/api/sheriklar/${s.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success("Sherik o'chirildi"); sherikYuklash() }
    else toast.error('Xatolik yuz berdi')
  }

  // ─── Berish ───
  function ochBerishModal() {
    setBerishIzoh('')
    setBerishTarkiblar([{ tovarNomi: '', miqdor: '', birlik: 'dona' }])
    setBerishModal(true)
  }

  function tarkibQosh() {
    setBerishTarkiblar(p => [...p, { tovarNomi: '', miqdor: '', birlik: 'dona' }])
  }

  function tarkibOchir(i: number) {
    setBerishTarkiblar(p => p.filter((_, idx) => idx !== i))
  }

  function tarkibOzgartir(i: number, key: string, val: string) {
    setBerishTarkiblar(p => p.map((t, idx) => idx === i ? { ...t, [key]: val } : t))
  }

  async function berishYuborish(e: React.FormEvent) {
    e.preventDefault()
    if (!tanlanganSherik) return
    const tarkib = berishTarkiblar.filter(t => t.tovarNomi.trim() && parseFloat(t.miqdor) > 0)
    if (!tarkib.length) { toast.error("Kamida bitta mahsulot kiriting"); return }
    setBerishYuklanmoqda(true)
    const res = await fetch('/api/sherik-qarzlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sherikId: tanlanganSherik.id,
        izoh: berishIzoh || null,
        tarkiblar: tarkib.map(t => ({ tovarNomi: t.tovarNomi.trim(), miqdor: parseFloat(t.miqdor), birlik: t.birlik })),
      }),
    })
    setBerishYuklanmoqda(false)
    if (res.ok) {
      toast.success('Mahsulot berildi')
      setBerishModal(false)
      qarzlarYuklash(tanlanganSherik)
      // Update ochiqQarzlar count
      setTanlanganSherik(s => s ? { ...s, ochiqQarzlar: s.ochiqQarzlar + 1 } : s)
    } else toast.error('Xatolik yuz berdi')
  }

  // ─── Qaytarish ───
  function ochQaytarishModal(qarz: SherikQarz) {
    setQaytarishQarz(qarz)
    const init: Record<string, string> = {}
    qarz.tarkiblar.forEach(t => { init[t.id] = '' })
    setQaytarishMiqdorlar(init)
  }

  async function qaytarishYuborish(e: React.FormEvent) {
    e.preventDefault()
    if (!qaytarishQarz || !tanlanganSherik) return
    const qaytarishlar = Object.entries(qaytarishMiqdorlar)
      .filter(([, v]) => parseFloat(v) > 0)
      .map(([tarkibId, miqdor]) => ({ tarkibId, miqdor: parseFloat(miqdor) }))
    if (!qaytarishlar.length) { toast.error("Miqdor kiriting"); return }
    setQaytarishYuklanmoqda(true)
    const res = await fetch(`/api/sherik-qarzlar/${qaytarishQarz.id}/qaytarish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qaytarishlar }),
    })
    setQaytarishYuklanmoqda(false)
    if (res.ok) {
      toast.success('Qaytarish qayd etildi')
      setQaytarishQarz(null)
      qarzlarYuklash(tanlanganSherik)
    } else toast.error('Xatolik yuz berdi')
  }

  // ─── UI ───
  if (tanlanganSherik) {
    return (
      <div className="space-y-4">
        {/* Detail Header */}
        <div className="flex items-center gap-3">
          <button onClick={orqaga} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            <ArrowLeft size={16} /> Orqaga
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700" />
          <div className="flex-1 min-w-0">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-base truncate">{tanlanganSherik.ism}</h2>
            {tanlanganSherik.telefon && (
              <a href={`tel:${tanlanganSherik.telefon}`} className="text-xs text-blue-600 flex items-center gap-1">
                <Phone size={11} />{tanlanganSherik.telefon}
              </a>
            )}
          </div>
          <button onClick={ochBerishModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap text-sm">
            <PackagePlus size={15} /> Mahsulot berish
          </button>
        </div>

        {/* Qarzlar */}
        <div className="space-y-3">
          {qarzYuklanmoqda ? (
            <div className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</div>
          ) : qarzlar.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-600">
              Hali mahsulot berilmagan
            </div>
          ) : qarzlar.map(qarz => (
            <div key={qarz.id} className={`bg-white dark:bg-neutral-900 border rounded-2xl overflow-hidden ${
              qarz.holati === 'YOPILGAN'
                ? 'border-green-200 dark:border-green-900'
                : qarz.holati === 'QISMAN'
                ? 'border-amber-200 dark:border-amber-900'
                : 'border-red-200 dark:border-red-900'
            }`}>
              {/* Qarz header */}
              <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 min-w-0">
                  <HolatBadge holat={qarz.holati} />
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {new Date(qarz.yaratilgan).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  {qarz.izoh && <span className="text-xs text-gray-500 dark:text-gray-500 truncate">{qarz.izoh}</span>}
                </div>
                {qarz.holati !== 'YOPILGAN' && (
                  <button onClick={() => ochQaytarishModal(qarz)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition whitespace-nowrap">
                    <PackageCheck size={13} /> Qaytarish
                  </button>
                )}
              </div>
              {/* Tarkiblar */}
              <div className="px-4 py-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-600">
                      <th className="text-left pb-1 font-medium">Mahsulot</th>
                      <th className="text-right pb-1 font-medium">Miqdor</th>
                      <th className="text-right pb-1 font-medium">Qaytarildi</th>
                      <th className="text-right pb-1 font-medium">Qoldiq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qarz.tarkiblar.map(t => {
                      const qoldiq = Number(t.miqdor) - Number(t.qaytarilgan)
                      return (
                        <tr key={t.id} className="border-t border-gray-50 dark:border-neutral-800/50">
                          <td className="py-1.5 text-gray-800 dark:text-gray-200">{t.tovarNomi}</td>
                          <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">{fmt(Number(t.miqdor))} {t.birlik}</td>
                          <td className="py-1.5 text-right text-green-600 dark:text-green-400">{fmt(Number(t.qaytarilgan))} {t.birlik}</td>
                          <td className={`py-1.5 text-right font-medium ${qoldiq > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {fmt(qoldiq)} {t.birlik}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Berish modal */}
        {berishModal && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Mahsulot berish — {tanlanganSherik.ism}</h3>
                <button onClick={() => setBerishModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"><X size={18} /></button>
              </div>
              <form onSubmit={berishYuborish} className="p-5 space-y-4">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Izoh (ixtiyoriy)</label>
                  <input value={berishIzoh} onChange={e => setBerishIzoh(e.target.value)} placeholder="Sabab yoki eslatma..." className={inputCls} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Mahsulotlar</label>
                    <button type="button" onClick={tarkibQosh} className="text-xs text-red-600 hover:text-red-500 font-medium flex items-center gap-1">
                      <Plus size={13} /> Qo&apos;shish
                    </button>
                  </div>
                  <div className="space-y-2">
                    {berishTarkiblar.map((t, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <input
                          value={t.tovarNomi}
                          onChange={e => tarkibOzgartir(i, 'tovarNomi', e.target.value)}
                          placeholder="Mahsulot nomi"
                          className={inputCls + ' flex-[3]'}
                        />
                        <input
                          type="number"
                          value={t.miqdor}
                          onChange={e => tarkibOzgartir(i, 'miqdor', e.target.value)}
                          placeholder="Miqdor"
                          min="0"
                          step="any"
                          className={inputCls + ' flex-[1] min-w-0'}
                        />
                        <select value={t.birlik} onChange={e => tarkibOzgartir(i, 'birlik', e.target.value)} className={selectCls + ' flex-[1] min-w-0'}>
                          <option value="dona">dona</option>
                          <option value="kg">kg</option>
                          <option value="litr">litr</option>
                          <option value="metr">metr</option>
                          <option value="quti">quti</option>
                        </select>
                        {berishTarkiblar.length > 1 && (
                          <button type="button" onClick={() => tarkibOchir(i)} className="p-2 text-gray-400 hover:text-red-500 transition flex-shrink-0 mt-0.5">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setBerishModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor qilish</button>
                  <button type="submit" disabled={berishYuklanmoqda} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                    <PackagePlus size={15} />
                    {berishYuklanmoqda ? 'Saqlanmoqda...' : 'Berish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Qaytarish modal */}
        {qaytarishQarz && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Qaytarish qayd etish</h3>
                <button onClick={() => setQaytarishQarz(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"><X size={18} /></button>
              </div>
              <form onSubmit={qaytarishYuborish} className="p-5 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Qaytarilgan miqdorni kiriting</p>
                {qaytarishQarz.tarkiblar.map(t => {
                  const qoldiq = Number(t.miqdor) - Number(t.qaytarilgan)
                  if (qoldiq <= 0) return null
                  return (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.tovarNomi}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-600">Qoldiq: {fmt(qoldiq)} {t.birlik}</span>
                      </div>
                      <input
                        type="number"
                        value={qaytarishMiqdorlar[t.id] || ''}
                        onChange={e => setQaytarishMiqdorlar(p => ({ ...p, [t.id]: e.target.value }))}
                        placeholder={`0 — ${fmt(qoldiq)} oralig'ida`}
                        min="0"
                        max={qoldiq}
                        step="any"
                        className={inputCls}
                      />
                    </div>
                  )
                })}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setQaytarishQarz(null)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor qilish</button>
                  <button type="submit" disabled={qaytarishYuklanmoqda} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                    <PackageCheck size={15} />
                    {qaytarishYuklanmoqda ? 'Saqlanmoqda...' : 'Qayd etish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Main list view ───
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={qidiruv} onChange={setQidiruv} placeholder="Sherik qidirish..." className="flex-1" />
        <button onClick={() => ochSherikModal()} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <Plus size={16} />
          Sherik qo&apos;shish
        </button>
      </div>

      {/* Jadval */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Sherik</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell">Telefon</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Manzil</th>
                <th className="text-center text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Ochiq</th>
                <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Amal</th>
              </tr>
            </thead>
            <tbody>
              {yuklanmoqda ? (
                <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
              ) : sheriklar.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-12">Sheriklar topilmadi</td></tr>
              ) : sheriklar.map((s, idx) => (
                <tr
                  key={s.id}
                  onClick={() => sherikTanlash(s)}
                  className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer ${idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/40'}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{s.ism}</p>
                    {s.tavsif && <p className="text-xs text-gray-400 dark:text-gray-600 truncate max-w-[200px]">{s.tavsif}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {s.telefon ? (
                      <a href={`tel:${s.telefon}`} onClick={e => e.stopPropagation()} className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                        <Phone size={12} />{s.telefon}
                      </a>
                    ) : <span className="text-gray-400 dark:text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{s.manzil || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.ochiqQarzlar > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                        {s.ochiqQarzlar}
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => sherikTanlash(s)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition" title="Ko'rish">
                        <ChevronRight size={15} />
                      </button>
                      <button onClick={() => ochSherikModal(s)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => sherikOchirish(s)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
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

      {/* Sherik modal */}
      {sherikModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">{tahrirlash ? 'Sherik tahrirlash' : 'Yangi sherik'}</h3>
              <button onClick={() => setSherikModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={sherikSaqlash} className="p-5 space-y-4">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Ism *</label>
                <input value={sherikForm.ism} onChange={e => setSherikForm(f => ({ ...f, ism: e.target.value }))} required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Telefon 1</label>
                  <input value={sherikForm.telefon} onChange={e => setSherikForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+998..." className={inputCls} />
                </div>
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Telefon 2</label>
                  <input value={sherikForm.telefon2} onChange={e => setSherikForm(f => ({ ...f, telefon2: e.target.value }))} placeholder="+998..." className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Manzil</label>
                <input value={sherikForm.manzil} onChange={e => setSherikForm(f => ({ ...f, manzil: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Tavsif</label>
                <textarea value={sherikForm.tavsif} onChange={e => setSherikForm(f => ({ ...f, tavsif: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSherikModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">Bekor qilish</button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">{tahrirlash ? 'Saqlash' : "Qo'shish"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
