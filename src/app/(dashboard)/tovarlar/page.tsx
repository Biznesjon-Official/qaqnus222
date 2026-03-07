'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { formatSum } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Upload, Loader2, SlidersHorizontal, QrCode, Printer } from 'lucide-react'
import { normalizeUzbek } from '@/lib/utils'
import ViewToggle from '@/components/ViewToggle'
import Combobox from '@/components/ui/combobox'
import MoneyInput from '@/components/ui/money-input'
import SearchBar from '@/components/ui/search-bar'

// Dynamic import to avoid SSR issues with react-barcode
const Barcode = dynamic(() => import('react-barcode'), { ssr: false })

interface Kategoriya { id: string; nomi: string }
interface Tovar {
  id: string; nomi: string; kategoriya: Kategoriya
  kelishNarxi: number; sotishNarxi: number
  birlik: string; minimalQoldiq: number; shtrixKod: string | null
  holati: string; qoldiq: number
}

const BIRLIKLAR = ['DONA', 'KG', 'LITR', 'METR', 'PACHKA', 'QUTI']

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition'

export default function TovarlarPage() {
  const [tovarlar, setTovarlar] = useState<Tovar[]>([])
  const [kategoriyalar, setKategoriyalar] = useState<Kategoriya[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [qidiruv, setQidiruv] = useState('')
  const [modal, setModal] = useState(false)
  const [tahrirlash, setTahrirlash] = useState<Tovar | null>(null)
  const [importYuklanmoqda, setImportYuklanmoqda] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [kutayotganFayl, setKutayotganFayl] = useState<File | null>(null)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [aktifKategoriya, setAktifKategoriya] = useState<string | null>(null)
  const [katModal, setKatModal] = useState(false)
  const [katNomi, setKatNomi] = useState('')
  const [katYuklanmoqda, setKatYuklanmoqda] = useState(false)
  const [form, setForm] = useState({
    nomi: '', kategoriyaId: '', shtrixKod: '', kelishNarxi: '',
    sotishNarxi: '', birlik: 'DONA', minimalQoldiq: '5', boshlangichQoldiq: '0'
  })

  // Qoldiq sozlash state
  const [qoldiqModal, setQoldiqModal] = useState(false)
  const [qoldiqTovar, setQoldiqTovar] = useState<{ id: string; nomi: string; qoldiq: number } | null>(null)
  const [yangiQoldiq, setYangiQoldiq] = useState('')
  const [qoldiqYuklanmoqda, setQoldiqYuklanmoqda] = useState(false)

  // Barcode print state
  const [barcodeModal, setBarcodeModal] = useState(false)
  const [barcodeTovar, setBarcodeTovar] = useState<{ id: string; nomi: string; shtrixKod: string | null } | null>(null)

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
    const params = new URLSearchParams({
      q: normalizeUzbek(qidiruv),
      limit: '9999',
      ...(aktifKategoriya ? { kategoriya: aktifKategoriya } : {}),
    })
    const [tv, kt] = await Promise.all([
      fetch(`/api/tovarlar?${params}`).then(r => r.json()),
      fetch('/api/kategoriyalar').then(r => r.json()),
    ])
    setTovarlar(tv.tovarlar || [])
    setKategoriyalar(kt || [])
    setYuklanmoqda(false)
  }

  useEffect(() => { yuklash() }, [qidiruv, aktifKategoriya])

  function ochModal(tovar?: Tovar) {
    if (tovar) {
      setTahrirlash(tovar)
      setForm({
        nomi: tovar.nomi, kategoriyaId: tovar.kategoriya.id,
        shtrixKod: tovar.shtrixKod || '', kelishNarxi: String(tovar.kelishNarxi),
        sotishNarxi: String(tovar.sotishNarxi), birlik: tovar.birlik,
        minimalQoldiq: String(tovar.minimalQoldiq), boshlangichQoldiq: '0'
      })
    } else {
      setTahrirlash(null)
      setForm({ nomi: '', kategoriyaId: kategoriyalar[0]?.id || '', shtrixKod: '',
        kelishNarxi: '', sotishNarxi: '', birlik: 'DONA', minimalQoldiq: '5', boshlangichQoldiq: '0' })
    }
    setModal(true)
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    const url = tahrirlash ? `/api/tovarlar/${tahrirlash.id}` : '/api/tovarlar'
    const method = tahrirlash ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      toast.success(tahrirlash ? 'Tovar yangilandi' : "Tovar qo'shildi")
      setModal(false)
      yuklash()
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Xatolik yuz berdi')
    }
  }

  async function kategoriyaQoshish() {
    if (!katNomi.trim()) return
    setKatYuklanmoqda(true)
    const res = await fetch('/api/kategoriyalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomi: katNomi.trim() }),
    })
    if (res.ok) {
      const yangi = await res.json()
      toast.success("Kategoriya qo'shildi")
      setKategoriyalar(prev => [...prev, yangi])
      setAktifKategoriya(yangi.id)
      setKatNomi('')
      setKatModal(false)
    } else {
      toast.error("Xatolik yuz berdi")
    }
    setKatYuklanmoqda(false)
  }

  async function ochirish(id: string) {
    if (!confirm('Tovarni arxivlashni xohlaysizmi?')) return
    const res = await fetch(`/api/tovarlar/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Tovar arxivlandi'); yuklash() }
    else toast.error('Xatolik yuz berdi')
  }

  async function qoldiqSaqlash() {
    if (!qoldiqTovar) return
    setQoldiqYuklanmoqda(true)
    const res = await fetch('/api/ombor/sozlash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tovarId: qoldiqTovar.id, yangiQoldiq: parseFloat(yangiQoldiq) }),
    })
    setQoldiqYuklanmoqda(false)
    if (res.ok) {
      toast.success('Qoldiq yangilandi')
      setQoldiqModal(false)
      yuklash()
    } else {
      toast.error('Xatolik yuz berdi')
    }
  }

  function excelTanlash(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setKutayotganFayl(file)
    setImportModal(true)
  }

  async function excelImport(rejim: 'tozalash' | 'ustiga') {
    if (!kutayotganFayl) return
    setImportModal(false)
    setImportYuklanmoqda(true)
    const fd = new FormData()
    fd.append('file', kutayotganFayl)
    fd.append('rejim', rejim)
    setKutayotganFayl(null)
    try {
      const res = await fetch('/api/tovarlar/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        const msg = rejim === 'tozalash'
          ? `Import tugadi: ${data.qoshildi} ta tovar qo'shildi`
          : `Import tugadi: ${data.qoshildi} ta yangi, ${data.duplikat ?? 0} ta takror o'tkazildi`
        toast.success(msg)
        yuklash()
      } else {
        toast.error(data.xato || 'Import xatoligi')
      }
    } catch {
      toast.error('Import amalga oshmadi')
    } finally {
      setImportYuklanmoqda(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={qidiruv}
          onChange={setQidiruv}
          placeholder="Tovar nomi yoki shtrix-kod..."
          className="flex-1"
        />
        <ViewToggle view={view} onChange={changeView} />
        {/* Excel import */}
        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer border ${importYuklanmoqda ? 'opacity-60 cursor-not-allowed border-gray-300 dark:border-neutral-700 text-gray-400' : 'border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}>
          {importYuklanmoqda ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {importYuklanmoqda ? 'Yuklanmoqda...' : 'Excel import'}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={importYuklanmoqda}
            onChange={excelTanlash}
          />
        </label>
        <button onClick={() => ochModal()} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition whitespace-nowrap">
          <Plus size={16} />
          Tovar qo&apos;shish
        </button>
      </div>

      {/* Category navbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setAktifKategoriya(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
            aktifKategoriya === null
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          Barchasi
        </button>
        {kategoriyalar.map(k => (
          <button
            key={k.id}
            onClick={() => setAktifKategoriya(k.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
              aktifKategoriya === k.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            {k.nomi}
          </button>
        ))}
        <button
          onClick={() => { setKatNomi(''); setKatModal(true) }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition font-bold text-lg leading-none"
          title="Yangi kategoriya qo'shish"
        >
          +
        </button>
      </div>

      {/* Table view */}
      {(() => {
        const filteredTovarlar = tovarlar
        return (<>
      {view === 'table' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                  <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Tovar nomi</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Miqdori</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Kelish narxi</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Sotish narxi</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Kategoriya</th>
                  <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Amal</th>
                </tr>
              </thead>
              <tbody>
                {yuklanmoqda ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Yuklanmoqda...</td></tr>
                ) : filteredTovarlar.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 dark:text-gray-600 py-12">Tovarlar topilmadi</td></tr>
                ) : filteredTovarlar.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/40'}`}>
                    {/* Tovar nomi — title for full text on hover */}
                    <td className="px-4 py-3 whitespace-nowrap max-w-[200px]">
                      <p className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate" title={t.nomi}>{t.nomi}</p>
                      {t.shtrixKod && <p className="text-gray-400 dark:text-gray-600 text-xs truncate" title={t.shtrixKod}>{t.shtrixKod}</p>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`text-sm font-medium ${t.qoldiq <= t.minimalQoldiq ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {t.qoldiq} {t.birlik.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                      {formatSum(t.kelishNarxi)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 text-sm font-semibold whitespace-nowrap">
                      {formatSum(t.sotishNarxi)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-medium" title={t.kategoriya.nomi}>{t.kategoriya.nomi}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Qoldiq sozlash button */}
                        <button
                          onClick={() => { setQoldiqTovar({ id: t.id, nomi: t.nomi, qoldiq: t.qoldiq }); setYangiQoldiq(String(t.qoldiq)); setQoldiqModal(true) }}
                          className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition"
                          title="Qoldiq sozlash"
                        >
                          <SlidersHorizontal size={15} />
                        </button>
                        {/* Barcode print button */}
                        <button
                          onClick={() => { setBarcodeTovar({ id: t.id, nomi: t.nomi, shtrixKod: t.shtrixKod }); setBarcodeModal(true) }}
                          className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg transition"
                          title="Shtrix kod"
                        >
                          <QrCode size={15} />
                        </button>
                        <button onClick={() => ochModal(t)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => ochirish(t.id)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
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
      )}

      {/* Card view */}
      {view === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {yuklanmoqda ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Yuklanmoqda...</p>
          ) : filteredTovarlar.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-600 col-span-3 text-center py-12">Tovarlar topilmadi</p>
          ) : filteredTovarlar.map(t => (
            <div key={t.id} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">{t.nomi}</p>
                  {t.shtrixKod && <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">{t.shtrixKod}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {/* Qoldiq sozlash button */}
                  <button
                    onClick={() => { setQoldiqTovar({ id: t.id, nomi: t.nomi, qoldiq: t.qoldiq }); setYangiQoldiq(String(t.qoldiq)); setQoldiqModal(true) }}
                    className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition"
                    title="Qoldiq sozlash"
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                  {/* Barcode print button */}
                  <button
                    onClick={() => { setBarcodeTovar({ id: t.id, nomi: t.nomi, shtrixKod: t.shtrixKod }); setBarcodeModal(true) }}
                    className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg transition"
                    title="Shtrix kod"
                  >
                    <QrCode size={15} />
                  </button>
                  <button onClick={() => ochModal(t)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => ochirish(t.id)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Miqdori</p>
                  <p className={`font-semibold text-sm ${t.qoldiq <= t.minimalQoldiq ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                    {t.qoldiq} {t.birlik.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Kelish</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{formatSum(t.kelishNarxi)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Sotish</p>
                  <p className="text-green-600 font-semibold text-sm">{formatSum(t.sotishNarxi)}</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-lg font-medium">{t.kategoriya.nomi}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      </>)})()}

      {/* Import rejimi tanlash modali */}
      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-full mx-auto mb-4">
                <Upload size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-center text-lg mb-2">
                Excel import
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
                <span className="font-medium text-gray-700 dark:text-gray-300">{kutayotganFayl?.name}</span>
                <br />
                Mavjud tovarlar bilan nima qilish?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => excelImport('ustiga')}
                  className="w-full flex flex-col items-start px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition group"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 text-sm">
                    Ustiga qo&apos;shish
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                    Mavjud tovarlar saqlanadi. Bir xil nomli tovarlar ikkinchi marta qo&apos;shilmaydi
                  </span>
                </button>
                <button
                  onClick={() => excelImport('tozalash')}
                  className="w-full flex flex-col items-start px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition group"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-700 dark:group-hover:text-red-400 text-sm">
                    Eski tovarlarni arxivlab yangisini qo&apos;shish
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                    Barcha faol tovarlar arxivga o&apos;tkaziladi, keyin yangilari qo&apos;shiladi
                  </span>
                </button>
              </div>
              <button
                onClick={() => { setImportModal(false); setKutayotganFayl(null) }}
                className="w-full mt-3 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium transition"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategoriya qo'shish modali */}
      {katModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Yangi kategoriya</h3>
              <button onClick={() => setKatModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                autoFocus
                value={katNomi}
                onChange={e => setKatNomi(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && kategoriyaQoshish()}
                placeholder="Kategoriya nomi..."
                className={inputCls}
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setKatModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                  Bekor qilish
                </button>
                <button type="button" onClick={kategoriyaQoshish} disabled={katYuklanmoqda || !katNomi.trim()}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-medium transition">
                  {katYuklanmoqda ? 'Saqlanmoqda...' : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Qoldiq sozlash modali */}
      {qoldiqModal && qoldiqTovar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Qoldiq sozlash</h3>
              <button
                onClick={() => setQoldiqModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{qoldiqTovar.nomi}</p>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Hozirgi qoldiq: {qoldiqTovar.qoldiq}
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Yangi qoldiq</label>
                <input
                  type="number"
                  value={yangiQoldiq}
                  onChange={e => setYangiQoldiq(e.target.value)}
                  min={0}
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setQoldiqModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={qoldiqSaqlash}
                  disabled={qoldiqYuklanmoqda}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-medium transition"
                >
                  {qoldiqYuklanmoqda ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode print modali */}
      {barcodeModal && barcodeTovar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Shtrix kod</h3>
              <button
                onClick={() => setBarcodeModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 text-center space-y-4" id="barcode-print-area">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{barcodeTovar.nomi}</p>
              {barcodeTovar.shtrixKod ? (
                <div className="flex justify-center bg-white dark:bg-neutral-800 rounded-xl p-4">
                  <Barcode value={barcodeTovar.shtrixKod} width={1.5} height={60} fontSize={12} />
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Shtrix kod mavjud emas</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-600">{barcodeTovar.shtrixKod}</p>
            </div>
            <div className="p-4 flex gap-3">
              <button
                onClick={() => setBarcodeModal(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  const area = document.getElementById('barcode-print-area')
                  if (!area) return
                  const win = window.open('', '_blank', 'width=300,height=300')
                  if (!win) return
                  win.document.write(
                    `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;font-family:sans-serif}p{margin:4px 0;font-size:13px;text-align:center}</style></head><body>${area.innerHTML}</body></html>`
                  )
                  win.document.close()
                  win.onload = () => { win.focus(); win.print() }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-gray-100 font-semibold">{tahrirlash ? 'Tovarni tahrirlash' : 'Yangi tovar'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saqlash} className="p-5 space-y-4">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Nomi *</label>
                <input value={form.nomi} onChange={e => setForm(f => ({...f, nomi: e.target.value}))} required className={inputCls} />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Kategoriya *</label>
                {/* Combobox replaces plain <select> for searchable category selection */}
                <Combobox
                  options={kategoriyalar.map(k => ({ value: k.id, label: k.nomi }))}
                  value={form.kategoriyaId}
                  onChange={v => setForm(f => ({ ...f, kategoriyaId: v }))}
                  placeholder="Kategoriya tanlang"
                  searchPlaceholder="Kategoriya qidirish..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Kelish narxi *</label>
                  {/* MoneyInput for formatted currency entry */}
                  <MoneyInput
                    value={form.kelishNarxi}
                    onChange={v => setForm(f => ({ ...f, kelishNarxi: v }))}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Sotish narxi *</label>
                  {/* MoneyInput for formatted currency entry */}
                  <MoneyInput
                    value={form.sotishNarxi}
                    onChange={v => setForm(f => ({ ...f, sotishNarxi: v }))}
                    required
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Birlik</label>
                  <select value={form.birlik} onChange={e => setForm(f => ({...f, birlik: e.target.value}))} className={inputCls}>
                    {BIRLIKLAR.map(b => <option key={b} value={b}>{b.toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Min. qoldiq</label>
                  <input type="number" value={form.minimalQoldiq} onChange={e => setForm(f => ({...f, minimalQoldiq: e.target.value}))} min="0" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Shtrix-kod</label>
                <input value={form.shtrixKod} onChange={e => setForm(f => ({...f, shtrixKod: e.target.value}))} className={inputCls} />
              </div>
              {!tahrirlash && (
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Boshlang&apos;ich qoldiq</label>
                  {/* MoneyInput for initial stock quantity */}
                  <MoneyInput
                    value={form.boshlangichQoldiq}
                    onChange={v => setForm(f => ({ ...f, boshlangichQoldiq: v }))}
                    placeholder="0"
                    suffix=""
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition">
                  {tahrirlash ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
