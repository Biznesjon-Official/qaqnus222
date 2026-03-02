'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, X, ArrowLeft, Phone,
  Building2, TrendingDown, Banknote, ChevronRight,
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

  // ─── Detail view ───
  if (tanlangan) {
    const jami = detail?.sotuvlar.reduce((s, sv) => s + Number(sv.yakuniySumma), 0) ?? 0
    const tolangan = detail?.tolovlar.reduce((s, t) => s + Number(t.summa), 0) ?? 0
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
          <button onClick={() => setTolovModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition text-sm">
            <Banknote size={15} /> To&apos;lov qildi
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

        {detailYuklanmoqda ? (
          <div className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sotuvlar */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2">
                <TrendingDown size={15} className="text-red-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Sotuvlar ({detail?.sotuvlar.length ?? 0})</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                {!detail?.sotuvlar.length ? (
                  <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">Sotuvlar yo'q</p>
                ) : detail.sotuvlar.map(s => (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{s.chekRaqami}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatSum(Number(s.yakuniySumma))}</span>
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                          {new Date(s.sana).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {s.tarkiblar.map(t => (
                        <div key={t.id} className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                          <span>{t.tovar.nomi}</span>
                          <span>{fmt(Number(t.miqdor))} {t.tovar.birlik} × {formatSum(Number(t.birlikNarxi))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* To'lovlar */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2">
                <Banknote size={15} className="text-green-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">To&apos;lovlar ({detail?.tolovlar.length ?? 0})</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                {!detail?.tolovlar.length ? (
                  <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">To'lovlar yo'q</p>
                ) : detail.tolovlar.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatSum(Number(t.summa))}</p>
                      {t.izoh && <p className="text-xs text-gray-400 dark:text-gray-600">{t.izoh}</p>}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {new Date(t.sana).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
