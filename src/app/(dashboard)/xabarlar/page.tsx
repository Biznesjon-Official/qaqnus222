'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  MessageSquare, CheckCircle, XCircle, Clock, RotateCcw, RefreshCw,
  Phone, User, Eye, X, ChevronLeft, ChevronRight, Filter, Search,
} from 'lucide-react'

// ─── Turlar ──────────────────────────────────────────────────────────────────

interface Xabar {
  id: string
  nasiyaId: string | null
  mijozId: string
  xabarTuri: string
  xabarMatni: string | null
  telegramTarget: string | null
  status: string
  yuborildi: boolean
  xato: string | null
  urinishSoni: number
  sana: string
  yuborilganSana: string | null
  mijoz: { id: string; ism: string; telefon: string | null }
  nasiya: { id: string; jamiQarz: number; qoldiq: number; holati: string } | null
}

interface Stats {
  sent: number
  failed: number
  pending: number
  jami: number
}

// ─── Konstantalar ────────────────────────────────────────────────────────────

const XABAR_TURI_LABELLARI: Record<string, string> = {
  nasiya_yaratildi: 'Nasiya ochildi',
  qarz_qoshildi: "Qarz qo'shildi",
  tolov_qilindi: "To'lov qilindi",
  '3_kun': '3 kun eslatma',
  '2_kun': '2 kun eslatma',
  '1_kun': '1 kun eslatma',
  muddati_otgan: "Muddati o'tgan",
  qolbola: "Qo'lbola xabar",
}

const XABAR_TURI_RANGI: Record<string, string> = {
  nasiya_yaratildi: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  qarz_qoshildi: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
  tolov_qilindi: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  '3_kun': 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  '2_kun': 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  '1_kun': 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  muddati_otgan: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  qolbola: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400',
}

// ─── Helper funksiyalar ──────────────────────────────────────────────────────

function formatVaqt(sana: string) {
  const d = new Date(sana)
  const bugun = new Date()
  const farqSoat = (bugun.getTime() - d.getTime()) / (1000 * 60 * 60)
  if (farqSoat < 1) return `${Math.round(farqSoat * 60)} daqiqa oldin`
  if (farqSoat < 24) return `${Math.round(farqSoat)} soat oldin`
  return d.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status, xato }: { status: string; xato: string | null }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle size={12} /> Yuborildi
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        title={xato || ''}
      >
        <XCircle size={12} /> Xatolik
      </span>
    )
  }
  if (status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
        <Clock size={12} /> Navbatda
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
      <Clock size={12} /> Kutmoqda
    </span>
  )
}

// ─── Xabarni ko'rish modali ──────────────────────────────────────────────────

function XabarModal({ xabar, onClose }: { xabar: Xabar; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-start justify-between">
          <div>
            <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">Xabar tafsilotlari</h3>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-0.5">{xabar.mijoz.ism}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-xs">Holat</p>
              <div className="mt-1">
                <StatusBadge status={xabar.status} xato={xabar.xato} />
              </div>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-xs">Turi</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm mt-1 font-medium">
                {XABAR_TURI_LABELLARI[xabar.xabarTuri] || xabar.xabarTuri}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-xs">Telegram raqam</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm mt-1 font-mono">
                {xabar.telegramTarget || xabar.mijoz.telefon || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-xs">Urinishlar</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm mt-1">{xabar.urinishSoni} ta</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-xs">Yaratilgan</p>
              <p className="text-gray-900 dark:text-gray-100 text-sm mt-1">{formatVaqt(xabar.sana)}</p>
            </div>
            {xabar.yuborilganSana && (
              <div>
                <p className="text-gray-500 dark:text-gray-500 text-xs">Yuborilgan</p>
                <p className="text-gray-900 dark:text-gray-100 text-sm mt-1">{formatVaqt(xabar.yuborilganSana)}</p>
              </div>
            )}
          </div>

          {/* Xato */}
          {xabar.xato && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl">
              <p className="text-red-700 dark:text-red-400 text-xs font-semibold mb-1">Xato:</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{xabar.xato}</p>
            </div>
          )}

          {/* Xabar matni */}
          <div>
            <p className="text-gray-500 dark:text-gray-500 text-xs mb-2">Xabar matni:</p>
            <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
              {xabar.xabarMatni || '— (matn saqlanmagan)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Asosiy sahifa ───────────────────────────────────────────────────────────

export default function XabarlarPage() {
  const [xabarlar, setXabarlar] = useState<Xabar[]>([])
  const [stats, setStats] = useState<Stats>({ sent: 0, failed: 0, pending: 0, jami: 0 })
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [page, setPage] = useState(1)
  const [sahifalar, setSahifalar] = useState(1)
  const [jami, setJami] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [turiFilter, setTuriFilter] = useState('')
  const [mijozFilter, setMijozFilter] = useState('')
  const [tanlanganXabar, setTanlanganXabar] = useState<Xabar | null>(null)
  const [qaytaYuborilmoqda, setQaytaYuborilmoqda] = useState<string | null>(null)

  const yuklash = useCallback(async (showLoading = true) => {
    if (showLoading) setYuklanmoqda(true)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '30',
        ...(statusFilter && { status: statusFilter }),
        ...(turiFilter && { xabarTuri: turiFilter }),
        ...(mijozFilter && { mijozIsm: mijozFilter }),
      })
      const res = await fetch(`/api/xabarlar?${qs}`)
      const data = await res.json()
      setXabarlar(data.xabarlar || [])
      setStats(data.stats || { sent: 0, failed: 0, pending: 0, jami: 0 })
      setSahifalar(data.pagination?.sahifalar || 1)
      setJami(data.pagination?.jami || 0)
    } catch {
      toast.error('Xabarlarni yuklashda xatolik')
    } finally {
      setYuklanmoqda(false)
    }
  }, [page, statusFilter, turiFilter, mijozFilter])

  useEffect(() => {
    yuklash()
  }, [yuklash])

  // Har 15 soniyada avtomatik yangilash
  useEffect(() => {
    const interval = setInterval(() => yuklash(false), 15000)
    return () => clearInterval(interval)
  }, [yuklash])

  async function qaytaYuborish(id: string) {
    setQaytaYuborilmoqda(id)
    try {
      const res = await fetch(`/api/xabarlar/${id}/resend`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success('Xabar muvaffaqiyatli yuborildi!')
      } else {
        toast.error(data.xato || 'Qayta yuborishda xatolik')
      }
      yuklash(false)
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setQaytaYuborilmoqda(null)
    }
  }

  function filterReset() {
    setStatusFilter('')
    setTuriFilter('')
    setMijozFilter('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Statistika kartalari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          className={`text-left rounded-2xl p-5 transition-shadow border-2 ${statusFilter === '' ? 'border-red-500 shadow-md' : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'} bg-white dark:bg-neutral-900`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Jami xabarlar</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{stats.jami}</p>
            </div>
            <div className="w-11 h-11 bg-gray-500 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare size={20} className="text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter('sent'); setPage(1) }}
          className={`text-left rounded-2xl p-5 transition-shadow border-2 ${statusFilter === 'sent' ? 'border-green-500 shadow-md' : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'} bg-white dark:bg-neutral-900`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Yuborilgan</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.sent}</p>
            </div>
            <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter('failed'); setPage(1) }}
          className={`text-left rounded-2xl p-5 transition-shadow border-2 ${statusFilter === 'failed' ? 'border-red-500 shadow-md' : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'} bg-white dark:bg-neutral-900`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Xato</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.failed}</p>
            </div>
            <div className="w-11 h-11 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter('pending'); setPage(1) }}
          className={`text-left rounded-2xl p-5 transition-shadow border-2 ${statusFilter === 'pending' ? 'border-yellow-500 shadow-md' : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'} bg-white dark:bg-neutral-900`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Kutmoqda</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} className="text-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Filtrlash */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={mijozFilter}
              onChange={e => { setMijozFilter(e.target.value); setPage(1) }}
              placeholder="Mijoz ismi bo'yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={turiFilter}
            onChange={e => { setTuriFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Barcha turlar</option>
            {Object.entries(XABAR_TURI_LABELLARI).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {(statusFilter || turiFilter || mijozFilter) && (
            <button
              onClick={filterReset}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Filter size={14} /> Tozalash
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={() => yuklash()}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <RefreshCw size={14} /> Yangilash
          </button>
        </div>
      </div>

      {/* Jadval */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Mijoz</th>
                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell whitespace-nowrap">Turi</th>
                <th className="text-left text-gray-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Xabar</th>
                <th className="text-center text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Holat</th>
                <th className="text-right text-gray-500 text-xs font-medium px-4 py-3 hidden lg:table-cell whitespace-nowrap">Vaqt</th>
                <th className="text-center text-gray-500 text-xs font-medium px-4 py-3 whitespace-nowrap">Amal</th>
              </tr>
            </thead>
            <tbody>
              {yuklanmoqda ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">Yuklanmoqda...</td></tr>
              ) : xabarlar.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">Xabarlar topilmadi</td></tr>
              ) : xabarlar.map((x, idx) => (
                <tr
                  key={x.id}
                  className={`border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition ${idx % 2 === 1 ? 'bg-gray-50/40 dark:bg-neutral-800/40' : ''}`}
                >
                  {/* Mijoz */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                        {x.mijoz.ism.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate max-w-[140px]">{x.mijoz.ism}</p>
                        {x.telegramTarget && (
                          <p className="text-gray-400 dark:text-gray-500 text-xs font-mono truncate max-w-[140px]">{x.telegramTarget}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Turi */}
                  <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${XABAR_TURI_RANGI[x.xabarTuri] || 'bg-gray-50 text-gray-700'}`}>
                      {XABAR_TURI_LABELLARI[x.xabarTuri] || x.xabarTuri}
                    </span>
                  </td>

                  {/* Xabar preview */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 max-w-md">
                      {x.xabarMatni?.replace(/\n/g, ' ').slice(0, 120) || '—'}
                    </p>
                  </td>

                  {/* Holat */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <StatusBadge status={x.status} xato={x.xato} />
                  </td>

                  {/* Vaqt */}
                  <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-600 text-xs hidden lg:table-cell whitespace-nowrap">
                    {formatVaqt(x.sana)}
                  </td>

                  {/* Amal */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setTanlanganXabar(x)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                        title="Tafsilotlar"
                      >
                        <Eye size={14} />
                      </button>
                      {x.status === 'failed' && (
                        <button
                          onClick={() => qaytaYuborish(x.id)}
                          disabled={qaytaYuborilmoqda === x.id}
                          className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition disabled:opacity-50"
                          title="Qayta yuborish"
                        >
                          <RotateCcw size={14} className={qaytaYuborilmoqda === x.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sahifalar > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-neutral-800">
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              {(page - 1) * 30 + 1}–{Math.min(page * 30, jami)} / {jami} ta xabar
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                {page} / {sahifalar}
              </span>
              <button
                onClick={() => setPage(p => Math.min(sahifalar, p + 1))}
                disabled={page === sahifalar}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Xabar modal */}
      {tanlanganXabar && (
        <XabarModal xabar={tanlanganXabar} onClose={() => setTanlanganXabar(null)} />
      )}
    </div>
  )
}
