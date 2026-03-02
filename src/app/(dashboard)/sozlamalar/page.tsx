'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useTheme } from '@/components/ThemeContext'
import {
  Store, Users, User, Settings, Database,
  Plus, Pencil, Trash2, Eye, EyeOff, Shield,
  Sun, Moon, Monitor, Bell, Download, Save,
  Check, X, ToggleLeft, ToggleRight, Loader2, Tag,
} from 'lucide-react'
import SearchBar from '@/components/ui/search-bar'

// ---------------------------------------------------------------------------
// Shared style constants — kept consistent with the rest of the codebase
// ---------------------------------------------------------------------------
const inputCls =
  'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition'
const cardCls =
  'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6'
const labelCls = 'text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium'
const primaryBtn =
  'flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition'
const dangerBtn =
  'flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 rounded-xl font-medium transition'
const outlineBtn =
  'flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Rol = 'ADMIN' | 'KASSIR' | 'OMBORCHI'

interface Kategoriya {
  id: string
  nomi: string
  tavsif: string | null
  _count: { tovarlar: number }
}

interface Foydalanuvchi {
  id: string
  ism: string
  login: string
  rol: Rol
  faol: boolean
  telefon: string | null
  yaratilgan: string
}

// Tab definitions — Foydalanuvchilar tab is ADMIN-only (hidden for others)
type TabId = 'dokon' | 'foydalanuvchilar' | 'profil' | 'tizim' | 'zaxira'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
  adminOnly: boolean
}

const TABS: Tab[] = [
  { id: 'dokon', label: "Do'kon ma'lumotlari", icon: <Store size={16} />, adminOnly: false },
  { id: 'foydalanuvchilar', label: 'Foydalanuvchilar', icon: <Users size={16} />, adminOnly: true },
  { id: 'profil', label: 'Profil', icon: <User size={16} />, adminOnly: false },
  { id: 'tizim', label: 'Tizim sozlamalari', icon: <Settings size={16} />, adminOnly: false },
  { id: 'zaxira', label: 'Zaxira nusxa', icon: <Database size={16} />, adminOnly: true },
]

// Role display map
const ROL_MAP: Record<Rol, string> = {
  ADMIN: 'Administrator',
  KASSIR: 'Kassir',
  OMBORCHI: 'Omborchi',
}

// ---------------------------------------------------------------------------
// Helper: Modal backdrop
// ---------------------------------------------------------------------------
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — Do'kon ma'lumotlari
// ---------------------------------------------------------------------------
function DokonTab({ isAdmin }: { isAdmin: boolean }) {
  const [form, setForm] = useState({
    dokon_nomi: '',
    manzil: '',
    telefon: '',
    valyuta: "so'm",
    chek_matn: '',
  })
  const [saqlanyapti, setSaqlanyapti] = useState(false)

  // Kategoriyalar state
  const [kategoriyalar, setKategoriyalar] = useState<Kategoriya[]>([])
  const [katModal, setKatModal] = useState<'new' | Kategoriya | null>(null)
  const [katForm, setKatForm] = useState({ nomi: '', tavsif: '' })
  const [katSaqlanyapti, setKatSaqlanyapti] = useState(false)

  async function kategoriyalarYuklash() {
    fetch('/api/kategoriyalar').then(r => r.json()).then(d => setKategoriyalar(d || []))
  }

  async function katSaqlash(e: React.FormEvent) {
    e.preventDefault()
    setKatSaqlanyapti(true)
    try {
      const isEdit = katModal !== 'new' && katModal !== null
      const url = isEdit ? `/api/kategoriyalar/${(katModal as Kategoriya).id}` : '/api/kategoriyalar'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(katForm),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.xato || 'Xatolik'); return }
      toast.success(isEdit ? 'Kategoriya yangilandi!' : 'Kategoriya qo\'shildi!')
      setKatModal(null)
      kategoriyalarYuklash()
    } finally {
      setKatSaqlanyapti(false)
    }
  }

  async function katOchirish(kat: Kategoriya) {
    if (!confirm(`"${kat.nomi}" kategoriyasini o'chirasizmi?`)) return
    const res = await fetch(`/api/kategoriyalar/${kat.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { toast.error(json.xato || 'Xatolik'); return }
    toast.success('Kategoriya o\'chirildi!')
    kategoriyalarYuklash()
  }

  function openKatEdit(kat: Kategoriya) {
    setKatForm({ nomi: kat.nomi, tavsif: kat.tavsif || '' })
    setKatModal(kat)
  }

  // Load existing settings on mount
  useEffect(() => {
    fetch('/api/sozlamalar')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          dokon_nomi: data.dokon_nomi || '',
          manzil: data.manzil || '',
          telefon: data.telefon || '',
          valyuta: data.valyuta || "so'm",
          chek_matn: data.chek_matn || '',
        })
      })
      .catch(() => toast.error('Sozlamalarni yuklashda xatolik'))
    kategoriyalarYuklash()
  }, [])

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    setSaqlanyapti(true)
    try {
      const res = await fetch('/api/sozlamalar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Do'kon ma'lumotlari saqlandi!")
      } else {
        toast.error('Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaqlanyapti(false)
    }
  }

  return (
    <div className="space-y-6">
    <div className={cardCls}>
      <div className="flex items-center gap-2 mb-6">
        <Store size={18} className="text-red-600" />
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
          Do&apos;kon ma&apos;lumotlari
        </h2>
      </div>

      <form onSubmit={saqlash} className="space-y-4">
        {/* Do'kon nomi */}
        <div>
          <label className={labelCls}>Do&apos;kon nomi</label>
          <input
            type="text"
            value={form.dokon_nomi}
            onChange={e => setForm(f => ({ ...f, dokon_nomi: e.target.value }))}
            placeholder="Masalan: Optimum Do'koni"
            disabled={!isAdmin}
            className={inputCls}
          />
        </div>

        {/* Manzil */}
        <div>
          <label className={labelCls}>Manzil</label>
          <input
            type="text"
            value={form.manzil}
            onChange={e => setForm(f => ({ ...f, manzil: e.target.value }))}
            placeholder="Shahar, ko'cha, uy raqami"
            disabled={!isAdmin}
            className={inputCls}
          />
        </div>

        {/* Telefon */}
        <div>
          <label className={labelCls}>Telefon</label>
          <input
            type="text"
            value={form.telefon}
            onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
            placeholder="+998 90 000 00 00"
            disabled={!isAdmin}
            className={inputCls}
          />
        </div>

        {/* Valyuta */}
        <div>
          <label className={labelCls}>Valyuta</label>
          <select
            value={form.valyuta}
            onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))}
            disabled={!isAdmin}
            className={inputCls}
          >
            <option value="so'm">So&apos;m (UZS)</option>
            <option value="$">Dollar ($)</option>
            <option value="€">Yevro (€)</option>
          </select>
        </div>

        {/* Chek matni */}
        <div>
          <label className={labelCls}>Chek quyidagi matn</label>
          <textarea
            value={form.chek_matn}
            onChange={e => setForm(f => ({ ...f, chek_matn: e.target.value }))}
            rows={3}
            placeholder="Chek pastida chop etiladigan matn..."
            disabled={!isAdmin}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Save button — ADMIN only */}
        {isAdmin && (
          <div className="pt-2">
            <button type="submit" disabled={saqlanyapti} className={primaryBtn}>
              <Save size={16} />
              {saqlanyapti ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        )}

        {/* Read-only notice for non-admins */}
        {!isAdmin && (
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
            Faqat administrator o&apos;zgartirishi mumkin.
          </p>
        )}
      </form>
    </div>

    {/* Kategoriyalar bo'limi */}
    <div className={cardCls}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-red-600" />
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">Kategoriyalar</h2>
          <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg">{kategoriyalar.length} ta</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setKatForm({ nomi: '', tavsif: '' }); setKatModal('new') }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition text-sm"
          >
            <Plus size={15} />
            Qo&apos;shish
          </button>
        )}
      </div>

      {kategoriyalar.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-600 text-center py-6">Kategoriyalar topilmadi</p>
      ) : (
        <div className="space-y-2">
          {kategoriyalar.map(kat => (
            <div key={kat.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                <Tag size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{kat.nomi}</p>
                {kat.tavsif && <p className="text-gray-400 dark:text-gray-600 text-xs truncate">{kat.tavsif}</p>}
              </div>
              <span className="text-gray-400 dark:text-gray-600 text-xs shrink-0">{kat._count.tovarlar} tovar</span>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openKatEdit(kat)}
                    className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => katOchirish(kat)}
                    className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Kategoriya modal */}
    {katModal !== null && (
      <Modal onClose={() => setKatModal(null)}>
        <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
            {katModal === 'new' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}
          </h3>
          <button onClick={() => setKatModal(null)} className="p-1.5 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={katSaqlash} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nomi *</label>
            <input
              value={katForm.nomi}
              onChange={e => setKatForm(f => ({ ...f, nomi: e.target.value }))}
              required
              placeholder="Masalan: Ichimliklar"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tavsif</label>
            <input
              value={katForm.tavsif}
              onChange={e => setKatForm(f => ({ ...f, tavsif: e.target.value }))}
              placeholder="Qisqacha izoh (ixtiyoriy)"
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setKatModal(null)} className={outlineBtn + ' flex-1 justify-center'}>Bekor</button>
            <button type="submit" disabled={katSaqlanyapti} className={primaryBtn + ' flex-1 justify-center'}>
              {katSaqlanyapti ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {katModal === 'new' ? "Qo'shish" : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Foydalanuvchilar (ADMIN only)
// ---------------------------------------------------------------------------
function FoydalanuvchilarTab() {
  const [users, setUsers] = useState<Foydalanuvchi[]>([])
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  const [tahrirlash, setTahrirlash] = useState<Foydalanuvchi | null>(null)
  const [showParol, setShowParol] = useState(false)
  const [qidiruv, setQidiruv] = useState('')

  // New user form
  const emptyNew = { ism: '', login: '', parol: '', rol: 'KASSIR' as Rol, telefon: '', telefon2: '' }
  const [newForm, setNewForm] = useState(emptyNew)

  // Edit user form
  const emptyEdit = { ism: '', rol: 'KASSIR' as Rol, parol: '', faol: true, telefon: '', telefon2: '' }
  const [editForm, setEditForm] = useState(emptyEdit)

  async function yuklash() {
    setYuklanmoqda(true)
    try {
      const res = await fetch('/api/foydalanuvchilar')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Foydalanuvchilarni yuklashda xatolik')
    } finally {
      setYuklanmoqda(false)
    }
  }

  useEffect(() => { yuklash() }, [])

  function ochEditModal(user: Foydalanuvchi) {
    setTahrirlash(user)
    const nums = user.telefon ? user.telefon.split(',').map(t => t.trim()) : []
    setEditForm({ ism: user.ism, rol: user.rol, parol: '', faol: user.faol, telefon: nums[0] || '', telefon2: nums[1] || '' })
    setShowParol(false)
    setModal('edit')
  }

  async function yangiYaratish(e: React.FormEvent) {
    e.preventDefault()
    try {
      const telefonStr = [newForm.telefon, newForm.telefon2].filter(t => t.trim()).join(',') || null
      const body = { ism: newForm.ism, login: newForm.login, parol: newForm.parol, rol: newForm.rol, telefon: telefonStr }
      const res = await fetch('/api/foydalanuvchilar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success("Foydalanuvchi qo'shildi!")
        setModal(null)
        setNewForm(emptyNew)
        yuklash()
      } else {
        const err = await res.json()
        toast.error(err.xato || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

  async function yangilash(e: React.FormEvent) {
    e.preventDefault()
    if (!tahrirlash) return
    try {
      const body: Record<string, unknown> = {
        ism: editForm.ism,
        rol: editForm.rol,
        faol: editForm.faol,
        telefon: [editForm.telefon, editForm.telefon2].filter(t => t.trim()).join(',') || null,
      }
      if (editForm.parol) body.parol = editForm.parol
      const res = await fetch(`/api/foydalanuvchilar/${tahrirlash.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Foydalanuvchi yangilandi!')
        setModal(null)
        yuklash()
      } else {
        const err = await res.json()
        toast.error(err.xato || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

  async function ochirish(user: Foydalanuvchi) {
    if (!confirm(`"${user.ism}" foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) return
    try {
      const res = await fetch(`/api/foydalanuvchilar/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Foydalanuvchi o'chirildi!")
        yuklash()
      } else {
        toast.error("O'chirishda xatolik")
      }
    } catch {
      toast.error('Tarmoq xatosi')
    }
  }

  return (
    <>
      <div className={cardCls}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-red-600" />
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
              Foydalanuvchilar
            </h2>
          </div>
          <button
            onClick={() => { setModal('new'); setNewForm(emptyNew) }}
            className={primaryBtn}
          >
            <Plus size={16} />
            Yangi foydalanuvchi
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <SearchBar value={qidiruv} onChange={setQidiruv} placeholder="Ism yoki login bo'yicha qidirish..." debounceMs={0} />
        </div>

        {/* Users table */}
        <div className="overflow-x-auto -mx-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-neutral-800 border-y border-gray-200 dark:border-neutral-800">
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-6 py-3">Ism</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3 hidden sm:table-cell">Login</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Rol</th>
                <th className="text-left text-gray-500 dark:text-gray-500 text-xs font-medium px-4 py-3">Holati</th>
                <th className="text-right text-gray-500 dark:text-gray-500 text-xs font-medium px-6 py-3">Amal</th>
              </tr>
            </thead>
            <tbody>
              {yuklanmoqda ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-10">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.filter(u => !qidiruv || u.ism.toLowerCase().includes(qidiruv.toLowerCase()) || u.login.toLowerCase().includes(qidiruv.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 dark:text-gray-600 py-10">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : users.filter(u => !qidiruv || u.ism.toLowerCase().includes(qidiruv.toLowerCase()) || u.login.toLowerCase().includes(qidiruv.toLowerCase())).map(u => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  {/* Ism */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.ism[0]?.toUpperCase()}
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                        {u.ism}
                      </span>
                    </div>
                  </td>
                  {/* Login */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-500 dark:text-gray-500 text-sm font-mono">
                      {u.login}
                    </span>
                  </td>
                  {/* Rol */}
                  <td className="px-4 py-3">
                    <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg font-medium">
                      {ROL_MAP[u.rol] ?? u.rol}
                    </span>
                  </td>
                  {/* Holati */}
                  <td className="px-4 py-3">
                    {u.faol ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-medium">
                        <Check size={12} /> Faol
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-500 px-2 py-1 rounded-lg font-medium">
                        <X size={12} /> Nofaol
                      </span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => ochEditModal(u)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition"
                        title="Tahrirlash"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => ochirish(u)}
                        className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                        title="O'chirish"
                      >
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

      {/* New user modal */}
      {modal === 'new' && (
        <Modal onClose={() => setModal(null)}>
          <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
              Yangi foydalanuvchi
            </h3>
            <button
              onClick={() => setModal(null)}
              className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={yangiYaratish} className="p-5 space-y-4">
            <div>
              <label className={labelCls}>Ism *</label>
              <input
                type="text"
                value={newForm.ism}
                onChange={e => setNewForm(f => ({ ...f, ism: e.target.value }))}
                required
                placeholder="To'liq ism"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Login *</label>
              <input
                type="text"
                value={newForm.login}
                onChange={e => setNewForm(f => ({ ...f, login: e.target.value }))}
                required
                placeholder="login_nomi"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Parol *</label>
              <div className="relative">
                <input
                  type={showParol ? 'text' : 'password'}
                  value={newForm.parol}
                  onChange={e => setNewForm(f => ({ ...f, parol: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Kamida 6 ta belgi"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowParol(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showParol ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Rol *</label>
              <select
                value={newForm.rol}
                onChange={e => setNewForm(f => ({ ...f, rol: e.target.value as Rol }))}
                className={inputCls}
              >
                <option value="KASSIR">Kassir</option>
                <option value="OMBORCHI">Omborchi</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Telefon 1</label>
                <input
                  type="text"
                  value={newForm.telefon}
                  onChange={e => setNewForm(f => ({ ...f, telefon: e.target.value }))}
                  placeholder="+998 90 000 00 00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Telefon 2</label>
                <input
                  type="text"
                  value={newForm.telefon2}
                  onChange={e => setNewForm(f => ({ ...f, telefon2: e.target.value }))}
                  placeholder="+998 91 000 00 00"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className={outlineBtn}
              >
                Bekor qilish
              </button>
              <button type="submit" className={`${primaryBtn} flex-1 justify-center`}>
                <Plus size={16} />
                Qo&apos;shish
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit user modal */}
      {modal === 'edit' && tahrirlash && (
        <Modal onClose={() => setModal(null)}>
          <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
              Tahrirlash — {tahrirlash.ism}
            </h3>
            <button
              onClick={() => setModal(null)}
              className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={yangilash} className="p-5 space-y-4">
            <div>
              <label className={labelCls}>Ism *</label>
              <input
                type="text"
                value={editForm.ism}
                onChange={e => setEditForm(f => ({ ...f, ism: e.target.value }))}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Rol *</label>
              <select
                value={editForm.rol}
                onChange={e => setEditForm(f => ({ ...f, rol: e.target.value as Rol }))}
                className={inputCls}
              >
                <option value="KASSIR">Kassir</option>
                <option value="OMBORCHI">Omborchi</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Yangi parol{' '}
                <span className="text-gray-400 dark:text-gray-600 font-normal">(ixtiyoriy)</span>
              </label>
              <div className="relative">
                <input
                  type={showParol ? 'text' : 'password'}
                  value={editForm.parol}
                  onChange={e => setEditForm(f => ({ ...f, parol: e.target.value }))}
                  minLength={6}
                  placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowParol(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showParol ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {/* Faol toggle */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                Faollik holati
              </span>
              <button
                type="button"
                onClick={() => setEditForm(f => ({ ...f, faol: !f.faol }))}
                className={`transition ${editForm.faol ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'}`}
              >
                {editForm.faol
                  ? <ToggleRight size={28} />
                  : <ToggleLeft size={28} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Telefon 1</label>
                <input
                  type="text"
                  value={editForm.telefon}
                  onChange={e => setEditForm(f => ({ ...f, telefon: e.target.value }))}
                  placeholder="+998 90 000 00 00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Telefon 2</label>
                <input
                  type="text"
                  value={editForm.telefon2}
                  onChange={e => setEditForm(f => ({ ...f, telefon2: e.target.value }))}
                  placeholder="+998 91 000 00 00"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className={outlineBtn}
              >
                Bekor qilish
              </button>
              <button type="submit" className={`${primaryBtn} flex-1 justify-center`}>
                <Save size={16} />
                Saqlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 3 — Profil
// ---------------------------------------------------------------------------
function ProfilTab() {
  const { data: session, update } = useSession()
  const user = session?.user as any

  const rolNomi = ROL_MAP[user?.rol as Rol] ?? user?.rol ?? ''

  // Ism o'zgartirish
  const [ismForm, setIsmForm] = useState({ ism: '' })
  const [ismSaqlanmoqda, setIsmSaqlanmoqda] = useState(false)

  // Parol o'zgartirish
  const [parolForm, setParolForm] = useState({ yangiParol: '', tasdiqlash: '' })
  const [showYangi, setShowYangi] = useState(false)
  const [showTasd, setShowTasd] = useState(false)
  const [parolSaqlanmoqda, setParolSaqlanmoqda] = useState(false)

  // Initialize ism field once session loads
  useEffect(() => {
    if (user?.name) setIsmForm({ ism: user.name })
  }, [user?.name])

  async function ismSaqlash(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setIsmSaqlanmoqda(true)
    try {
      const res = await fetch(`/api/foydalanuvchilar/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ism: ismForm.ism, rol: user.rol, faol: true }),
      })
      if (res.ok) {
        toast.success("Ism muvaffaqiyatli o'zgartirildi!")
        // Refresh session so the header updates
        await update()
      } else {
        const err = await res.json()
        toast.error(err.xato || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setIsmSaqlanmoqda(false)
    }
  }

  async function parolSaqlash(e: React.FormEvent) {
    e.preventDefault()
    if (parolForm.yangiParol !== parolForm.tasdiqlash) {
      toast.error('Parollar mos kelmadi!')
      return
    }
    if (parolForm.yangiParol.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lsin!")
      return
    }
    setParolSaqlanmoqda(true)
    try {
      const res = await fetch('/api/foydalanuvchilar/parol', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yangiParol: parolForm.yangiParol }),
      })
      if (res.ok) {
        toast.success("Parol muvaffaqiyatli o'zgartirildi!")
        setParolForm({ yangiParol: '', tasdiqlash: '' })
      } else {
        const err = await res.json()
        toast.error(err.xato || 'Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setParolSaqlanmoqda(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar + info */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-6">
          <User size={18} className="text-red-600" />
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
            Profil ma&apos;lumotlari
          </h2>
        </div>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="space-y-1">
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg leading-tight">
              {user?.name}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm font-mono">
              {user?.login ?? user?.email}
            </p>
            <span className="inline-flex items-center gap-1 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg font-medium">
              <Shield size={11} /> {rolNomi}
            </span>
          </div>
        </div>
      </div>

      {/* Ism o'zgartirish */}
      <div className={cardCls}>
        <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
          Ismni o&apos;zgartirish
        </h3>
        <form onSubmit={ismSaqlash} className="space-y-4">
          <div>
            <label className={labelCls}>Yangi ism</label>
            <input
              type="text"
              value={ismForm.ism}
              onChange={e => setIsmForm({ ism: e.target.value })}
              required
              placeholder="Ismingizni kiriting"
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={ismSaqlanmoqda} className={primaryBtn}>
            <Save size={16} />
            {ismSaqlanmoqda ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>

      {/* Parol o'zgartirish */}
      <div className={cardCls}>
        <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
          Parolni o&apos;zgartirish
        </h3>
        <form onSubmit={parolSaqlash} className="space-y-4">
          <div>
            <label className={labelCls}>Yangi parol</label>
            <div className="relative">
              <input
                type={showYangi ? 'text' : 'password'}
                value={parolForm.yangiParol}
                onChange={e => setParolForm(f => ({ ...f, yangiParol: e.target.value }))}
                required
                minLength={6}
                placeholder="Kamida 6 ta belgi"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowYangi(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showYangi ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Parolni tasdiqlash</label>
            <div className="relative">
              <input
                type={showTasd ? 'text' : 'password'}
                value={parolForm.tasdiqlash}
                onChange={e => setParolForm(f => ({ ...f, tasdiqlash: e.target.value }))}
                required
                minLength={6}
                placeholder="Parolni qayta kiriting"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowTasd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {showTasd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={parolSaqlanmoqda} className={primaryBtn}>
            <Save size={16} />
            {parolSaqlanmoqda ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 4 — Tizim sozlamalari
// ---------------------------------------------------------------------------
function TizimTab() {
  const { theme, toggle } = useTheme()

  const [form, setForm] = useState({
    korinish_rejimi: 'system',
    til: "O'zbek",
    sahifa_miqdori: '20',
    bildirishnomalar: 'true',
  })
  const [saqlanyapti, setSaqlanyapti] = useState(false)

  // Load existing settings
  useEffect(() => {
    fetch('/api/sozlamalar')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setForm({
          korinish_rejimi: data.korinish_rejimi || 'system',
          til: data.til || "O'zbek",
          sahifa_miqdori: data.sahifa_miqdori || '20',
          bildirishnomalar: data.bildirishnomalar ?? 'true',
        })
      })
      .catch(() => {})
  }, [])

  // When the display mode select changes, also sync ThemeContext
  function handleKorinishChange(val: string) {
    setForm(f => ({ ...f, korinish_rejimi: val }))
    // Map select value to the ThemeContext toggle
    if (val === 'dark' && theme !== 'dark') toggle()
    if (val === 'light' && theme !== 'light') toggle()
    // 'system' — just save; ThemeProvider reads localStorage on mount
  }

  async function saqlash(e: React.FormEvent) {
    e.preventDefault()
    setSaqlanyapti(true)
    try {
      const res = await fetch('/api/sozlamalar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Tizim sozlamalari saqlandi!')
      } else {
        toast.error('Xatolik yuz berdi')
      }
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setSaqlanyapti(false)
    }
  }

  const notifOn = form.bildirishnomalar === 'true'

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-6">
          <Settings size={18} className="text-red-600" />
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
            Tizim sozlamalari
          </h2>
        </div>

        <form onSubmit={saqlash} className="space-y-5">
          {/* Ko'rinish rejimi */}
          <div>
            <label className={labelCls}>Ko&apos;rinish rejimi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'light', label: 'Kunduzgi', icon: <Sun size={15} /> },
                { val: 'dark', label: 'Tungi', icon: <Moon size={15} /> },
                { val: 'system', label: 'Tizim', icon: <Monitor size={15} /> },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleKorinishChange(opt.val)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition
                    ${form.korinish_rejimi === opt.val
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Til */}
          <div>
            <label className={labelCls}>Til</label>
            <select
              value={form.til}
              onChange={e => setForm(f => ({ ...f, til: e.target.value }))}
              className={inputCls}
            >
              <option value="O'zbek">O&apos;zbek</option>
              <option value="Русский">Русский</option>
              <option value="English">English</option>
            </select>
          </div>

          {/* Sahifa miqdori */}
          <div>
            <label className={labelCls}>Sahifadagi yozuvlar</label>
            <select
              value={form.sahifa_miqdori}
              onChange={e => setForm(f => ({ ...f, sahifa_miqdori: e.target.value }))}
              className={inputCls}
            >
              <option value="10">10 ta</option>
              <option value="20">20 ta</option>
              <option value="50">50 ta</option>
              <option value="100">100 ta</option>
            </select>
          </div>

          {/* Bildirishnomalar toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-500 dark:text-gray-500" />
              <div>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  Bildirishnomalar
                </p>
                <p className="text-gray-400 dark:text-gray-600 text-xs">
                  {notifOn ? 'Yoqilgan' : "O'chirilgan"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm(f => ({ ...f, bildirishnomalar: notifOn ? 'false' : 'true' }))
              }
              className={`transition ${notifOn ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'}`}
            >
              {notifOn ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          <button type="submit" disabled={saqlanyapti} className={primaryBtn}>
            <Save size={16} />
            {saqlanyapti ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>

      {/* Export section */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-red-600" />
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
            Excel ga export
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
          Barcha ma&apos;lumotlarni Excel formatida yuklab olish.
        </p>
        <button
          type="button"
          onClick={() => toast.info('Tez kunda!')}
          className={outlineBtn}
        >
          <Download size={16} />
          Excel yuklab olish
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 5 — Zaxira nusxa (ADMIN only)
// ---------------------------------------------------------------------------
function ZaxiraTab() {
  const [exporting, setExporting] = useState(false)

  // Read last backup timestamp from localStorage (set after each successful export)
  const [lastBackup, setLastBackup] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('lastBackup')
    setLastBackup(stored)
  }, [])

  // Download full JSON backup from the API
  async function exportBackup() {
    setExporting(true)
    try {
      const res = await fetch('/api/backup/export')
      if (!res.ok) {
        toast.error('Xatolik yuz berdi')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `erp_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      // Persist timestamp so it survives page reloads
      const now = new Date().toISOString()
      localStorage.setItem('lastBackup', now)
      setLastBackup(now)
      toast.success('Zaxira nusxasi yuklandi!')
    } catch {
      toast.error('Tarmoq xatosi')
    } finally {
      setExporting(false)
    }
  }

  // Format the stored ISO timestamp for display
  function formatBackupDate(iso: string | null): string {
    if (!iso) return "Hali olinmagan"
    try {
      return new Date(iso).toLocaleString('uz-UZ', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Export card */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-1">
          <Download size={18} className="text-red-600" />
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
            Zaxira nusxasini yuklab olish
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-500 text-sm mb-5">
          Barcha ma&apos;lumotlar JSON formatda yuklab olinadi (tovarlar, sotuvlar, mijozlar va boshqalar).
        </p>
        <button
          type="button"
          onClick={exportBackup}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition disabled:opacity-50"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'Yuklanmoqda...' : 'Yuklab olish'}
        </button>
      </div>

      {/* Last backup info */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-red-600" />
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
            So&apos;nggi zaxira
          </h3>
        </div>
        <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs mb-1 uppercase tracking-wide font-medium">
            Sana va vaqt
          </p>
          <p className="text-gray-900 dark:text-gray-100 font-semibold">
            {formatBackupDate(lastBackup)}
          </p>
          {lastBackup && (
            <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
              Brauzer xotirasida saqlanadi
            </p>
          )}
        </div>
      </div>

      {/* Import section — coming soon */}
      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-1">
          <Database size={18} className="text-gray-400 dark:text-gray-600" />
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">
            Import
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
          JSON zaxira faylidan ma&apos;lumotlarni tiklash.
        </p>
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
          <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
            Import funksiyasi tez kunda qo&apos;shiladi
          </span>
        </div>
      </div>

      {/* System info */}
      <div className={cardCls}>
        <h3 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
          Tizim haqida
        </h3>
        <div className="space-y-0 text-sm divide-y divide-gray-100 dark:divide-neutral-800">
          {[
            { key: 'Ilova versiyasi', val: '1.0.0' },
            { key: "Ma'lumotlar bazasi", val: 'PostgreSQL' },
            { key: 'Framework', val: 'Next.js 16.1.6' },
            { key: 'Runtime', val: 'Node.js' },
          ].map(row => (
            <div key={row.key} className="flex justify-between py-2.5">
              <span className="text-gray-500 dark:text-gray-500">{row.key}:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 dark:border-red-900/50 rounded-2xl p-6 bg-red-50/50 dark:bg-red-950/10">
        <h3 className="text-red-600 dark:text-red-400 font-semibold mb-1 flex items-center gap-2">
          <Trash2 size={16} />
          Xavfli zona
        </h3>
        <p className="text-red-500 dark:text-red-400/70 text-sm mb-4">
          Bu amalni ortga qaytarib bo&apos;lmaydi. Diqqat bilan bajaring!
        </p>
        <button
          type="button"
          onClick={() =>
            toast.error(
              "Bu amal ma'lumotlar bazasini tozalaydi! Haqiqiy tizimda bu amalga oshirilmaydi.",
              { duration: 6000 }
            )
          }
          className={dangerBtn}
        >
          <Trash2 size={16} />
          Ma&apos;lumotlar bazasini tozalash
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function SozlamalarPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.rol === 'ADMIN'
  const [activeTab, setActiveTab] = useState<TabId>('dokon')

  // Visible tabs depend on role
  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin)

  // If the currently active tab becomes hidden after role resolves, reset to first
  useEffect(() => {
    const ids = visibleTabs.map(t => t.id)
    if (!ids.includes(activeTab)) setActiveTab(ids[0])
  }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-gray-900 dark:text-gray-100 text-xl font-bold">Sozlamalar</h1>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-0.5">
          Tizim va profil sozlamalarini boshqarish
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-0 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition
                ${activeTab === tab.id
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-neutral-700'}`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'dokon' && <DokonTab isAdmin={isAdmin} />}
      {activeTab === 'foydalanuvchilar' && isAdmin && <FoydalanuvchilarTab />}
      {activeTab === 'profil' && <ProfilTab />}
      {activeTab === 'tizim' && <TizimTab />}
      {activeTab === 'zaxira' && isAdmin && <ZaxiraTab />}
    </div>
  )
}
