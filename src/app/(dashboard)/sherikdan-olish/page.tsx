'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSanaVaVaqt } from '@/lib/utils'
import { toast } from 'sonner'
import { Handshake, ChevronDown, ChevronRight, Edit2, X, Loader2, Check, DollarSign, Package } from 'lucide-react'
import Combobox from '@/components/ui/combobox'

interface SherikOlish {
  id: string
  sotuvId: string
  sherikId: string
  tovarId: string
  miqdor: number
  narx: number
  jami: number
  izoh: string | null
  yaratilgan: string
  sherik: { id: string; ism: string; telefon: string | null }
  tovar: { id: string; nomi: string; birlik: string }
  sotuv: { id: string; chekRaqami: string; sana: string }
  tolovlar: { id: string; summa: number; turi: string; izoh: string | null; yaratilgan: string }[]
}

interface SherikGuruh {
  sherik: { id: string; ism: string; telefon: string | null }
  olishlar: SherikOlish[]
  jamiQarz: number
  tolangan: number
  qoldiq: number
}

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm'

export default function SherikdanOlishPage() {
  const [data, setData] = useState<SherikGuruh[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [ochiqSheriklar, setOchiqSheriklar] = useState<Record<string, boolean>>({})

  // To'lov modal
  const [tolovModal, setTolovModal] = useState(false)
  const [tolovSherikId, setTolovSherikId] = useState('')
  const [tolovOlishId, setTolovOlishId] = useState('')
  const [tolovSumma, setTolovSumma] = useState('')
  const [tolovTuri, setTolovTuri] = useState('PUL')
  const [tolovIzoh, setTolovIzoh] = useState('')
  const [tolovYuklanmoqda, setTolovYuklanmoqda] = useState(false)

  // Tahrirlash modal
  const [tahririModal, setTahririModal] = useState(false)
  const [tahririId, setTahririId] = useState('')
  const [tahririMiqdor, setTahririMiqdor] = useState('')
  const [tahririSherikId, setTahririSherikId] = useState('')
  const [sheriklar, setSheriklar] = useState<{ id: string; ism: string; telefon: string | null }[]>([])
  const [tahririYuklanmoqda, setTahririYuklanmoqda] = useState(false)

  async function yuklash() {
    setYuklanmoqda(true)
    try {
      const [res, shRes] = await Promise.all([
        fetch('/api/sherikdan-olish'),
        fetch('/api/sheriklar'),
      ])
      const d = await res.json()
      const sh = await shRes.json()
      setData(Array.isArray(d) ? d : [])
      setSheriklar(Array.isArray(sh) ? sh.map((s: any) => ({ id: s.id, ism: s.ism, telefon: s.telefon })) : [])
    } catch { toast.error('Ma\'lumot yuklanmadi') }
    setYuklanmoqda(false)
  }

  useEffect(() => { yuklash() }, [])

  function toggleSherik(sherikId: string) {
    setOchiqSheriklar(prev => ({ ...prev, [sherikId]: !prev[sherikId] }))
  }

  function tolovOch(sherikId: string, olishId?: string) {
    setTolovSherikId(sherikId)
    setTolovOlishId(olishId || '')
    setTolovSumma('')
    setTolovTuri('PUL')
    setTolovIzoh('')
    setTolovModal(true)
  }

  async function tolovYubor() {
    if (!tolovSumma || parseFloat(tolovSumma) <= 0) { toast.error('Summani kiriting'); return }
    setTolovYuklanmoqda(true)
    const res = await fetch('/api/sherikdan-olish/tolov', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sherikdanOlishId: tolovOlishId || null,
        sherikId: tolovSherikId,
        summa: tolovSumma,
        turi: tolovTuri,
        izoh: tolovIzoh || null,
      })
    })
    setTolovYuklanmoqda(false)
    if (res.ok) {
      toast.success('To\'lov saqlandi')
      setTolovModal(false)
      yuklash()
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Xatolik')
    }
  }

  function tahririOch(olish: SherikOlish) {
    setTahririId(olish.id)
    setTahririMiqdor(String(olish.miqdor))
    setTahririSherikId(olish.sherikId)
    setTahririModal(true)
  }

  async function tahririYubor() {
    setTahririYuklanmoqda(true)
    const res = await fetch('/api/sherikdan-olish', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: tahririId,
        sherikId: tahririSherikId,
        miqdor: tahririMiqdor,
      })
    })
    setTahririYuklanmoqda(false)
    if (res.ok) {
      toast.success('O\'zgartirildi')
      setTahririModal(false)
      yuklash()
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Xatolik')
    }
  }

  if (yuklanmoqda) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Handshake size={20} className="text-gray-500 dark:text-gray-500" />
          <h1 className="text-gray-900 dark:text-gray-100 text-lg font-bold">Sherikdan olishlar</h1>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-10 text-center">
          <Handshake size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-500">Sherikdan olishlar mavjud emas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(guruh => (
            <div key={guruh.sherik.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              {/* Sherik header */}
              <button
                onClick={() => toggleSherik(guruh.sherik.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
              >
                <div className="flex items-center gap-3">
                  {ochiqSheriklar[guruh.sherik.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">{guruh.sherik.ism}</p>
                    {guruh.sherik.telefon && <p className="text-gray-400 dark:text-gray-600 text-xs">{guruh.sherik.telefon}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-500">Jami qarz</p>
                    <p className="text-gray-900 dark:text-gray-100 font-bold">{formatSum(guruh.jamiQarz)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-500">To&apos;langan</p>
                    <p className="text-green-600 font-bold">{formatSum(guruh.tolangan)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-500">Qoldiq</p>
                    <p className={`font-bold ${guruh.qoldiq > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatSum(guruh.qoldiq)}</p>
                  </div>
                </div>
              </button>

              {/* Tafsilotlar */}
              {ochiqSheriklar[guruh.sherik.id] && (
                <div className="border-t border-gray-100 dark:border-neutral-800">
                  <div className="px-4 py-2 flex justify-end">
                    <button
                      onClick={() => tolovOch(guruh.sherik.id)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
                    >
                      <DollarSign size={12} />
                      To&apos;lov qilish
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-500 text-xs border-b border-gray-100 dark:border-neutral-800">
                        <th className="text-left px-4 py-2 font-medium">Tovar</th>
                        <th className="text-right px-4 py-2 font-medium">Miqdor</th>
                        <th className="text-right px-4 py-2 font-medium">Narx</th>
                        <th className="text-right px-4 py-2 font-medium">Jami</th>
                        <th className="text-left px-4 py-2 font-medium">Chek</th>
                        <th className="text-left px-4 py-2 font-medium">Sana</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruh.olishlar.map(olish => (
                        <tr key={olish.id} className="border-b border-gray-50 dark:border-neutral-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{olish.tovar.nomi}</td>
                          <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{Number(olish.miqdor)}</td>
                          <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{formatSum(olish.narx)}</td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100 font-medium">{formatSum(olish.jami)}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-500 text-xs">{olish.sotuv.chekRaqami}</td>
                          <td className="px-4 py-2 text-gray-400 dark:text-gray-600 text-xs">{formatSanaVaVaqt(olish.yaratilgan)}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => tahririOch(olish)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition"
                              title="Tahrirlash"
                            >
                              <Edit2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* To'lov modal */}
      {tolovModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                To&apos;lov qilish
              </h3>
              <button onClick={() => setTolovModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Summa</label>
                <input
                  type="number"
                  value={tolovSumma}
                  onChange={e => setTolovSumma(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTolovTuri('PUL')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 ${tolovTuri === 'PUL' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    <DollarSign size={12} /> Pul
                  </button>
                  <button
                    type="button"
                    onClick={() => setTolovTuri('TOVAR')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 ${tolovTuri === 'TOVAR' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    <Package size={12} /> Tovar
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Izoh (ixtiyoriy)</label>
                <input value={tolovIzoh} onChange={e => setTolovIzoh(e.target.value)} placeholder="Izoh..." className={inputCls} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setTolovModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium text-sm">
                  Bekor
                </button>
                <button
                  onClick={tolovYubor}
                  disabled={tolovYuklanmoqda}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-medium transition text-sm flex items-center justify-center gap-1"
                >
                  {tolovYuklanmoqda ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tahrirlash modal */}
      {tahririModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold flex items-center gap-2">
                <Edit2 size={16} className="text-blue-600" />
                Tahrirlash
              </h3>
              <button onClick={() => setTahririModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Miqdor</label>
                <input
                  type="number"
                  value={tahririMiqdor}
                  onChange={e => setTahririMiqdor(e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Sherik</label>
                <Combobox
                  options={sheriklar.map(s => ({ value: s.id, label: `${s.ism}${s.telefon ? ' — ' + s.telefon : ''}` }))}
                  value={tahririSherikId}
                  onChange={setTahririSherikId}
                  placeholder="Sherik tanlang"
                  searchPlaceholder="Sherik qidirish..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setTahririModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium text-sm">
                  Bekor
                </button>
                <button
                  onClick={tahririYubor}
                  disabled={tahririYuklanmoqda}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition text-sm flex items-center justify-center gap-1"
                >
                  {tahririYuklanmoqda ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
