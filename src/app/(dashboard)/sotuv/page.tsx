'use client'

import { useEffect, useState } from 'react'
import { formatSum, formatSanaVaVaqt } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, ShoppingCart, Trash2, CheckCircle, Printer, Download, RotateCcw, Clock, X, Loader2, AlertTriangle, Pencil } from 'lucide-react'
import Combobox from '@/components/ui/combobox'
import MoneyInput from '@/components/ui/money-input'

interface Tovar {
  id: string; nomi: string; sotishNarxi: number; birlik: string; qoldiq: number; shtrixKod: string | null
}
interface Mijoz { id: string; ism: string; telefon: string | null }
interface SherikDokon { id: string; nomi: string; telefon: string | null }
interface Sherik { id: string; ism: string; telefon: string | null }
interface SherikdanOlishItem {
  tovarId: string; tovarNomi: string; ortiqchaMiqdor: number; narx: number;
  sherikId: string; yangiSherikIsm: string; yangiSherikTelefon: string;
}
interface SavatItem {
  tovarId: string; nomi: string; birlikNarxi: number; miqdor: number; birlik: string; chegirma: number; jami: number; mavjudQoldiq: number
}

const TOLOV_USULLARI = [
  { value: 'NAQD', label: 'Naqd pul' },
  { value: 'KARTA', label: 'Bank kartasi' },
  { value: 'ARALASH', label: 'Aralash' },
  { value: 'NASIYA', label: 'Nasiya' },
  { value: 'SHERIK', label: 'Sherik uchun' },
]

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm'

export default function SotuvPage() {
  const [tovarlar, setTovarlar] = useState<Tovar[]>([])
  const [mijozlar, setMijozlar] = useState<Mijoz[]>([])
  const [sherikDokonlar, setSherikDokonlar] = useState<SherikDokon[]>([])
  const [savat, setSavat] = useState<SavatItem[]>([])
  const [qidiruv, setQidiruv] = useState('')
  const [tolovUsuli, setTolovUsuli] = useState('NAQD')
  const [naqdTolangan, setNaqdTolangan] = useState('')
  const [qolBilanSumma, setQolBilanSumma] = useState('')
  const [mijozId, setMijozId] = useState('')
  const [sherikDokonId, setSherikDokonId] = useState('')
  const [nasiyaMuddat, setNasiyaMuddat] = useState('')
  const [yuklanmoqda, setYuklanmoqda] = useState(false)
  const [chekModal, setChekModal] = useState(false)
  const [oxirgiSotuv, setOxirgiSotuv] = useState<any>(null)
  const [dokonInfo, setDokonInfo] = useState<Record<string, string>>({})
  const [editNarx, setEditNarx] = useState<{ tovarId: string; val: string } | null>(null)
  const [mobileTab, setMobileTab] = useState<'tovarlar' | 'savat'>('tovarlar')

  // Sherikdan olish modal
  const [sherikdanOlishModal, setSherikdanOlishModal] = useState(false)
  const [sheriklar, setSheriklar] = useState<Sherik[]>([])
  const [sherikdanOlishlar, setSherikdanOlishlar] = useState<SherikdanOlishItem[]>([])

  // Qaytarish
  const [qaytarishModal, setQaytarishModal] = useState(false)
  const [qaytarishSotuv, setQaytarishSotuv] = useState<any>(null)
  const [qaytarishTanlangan, setQaytarishTanlangan] = useState<Record<string, { miqdor: number; birlikNarxi: number; checked: boolean }>>({})
  const [qaytarishSabab, setQaytarishSabab] = useState('')
  const [qaytarishYuklanmoqda, setQaytarishYuklanmoqda] = useState(false)
  const [sotuvlarRoyxati, setSotuvlarRoyxati] = useState<any[]>([])
  const [sotuvlarYuklanmoqda, setSotuvlarYuklanmoqda] = useState(false)
  const [sotuvQidiruv, setSotuvQidiruv] = useState('')

  useEffect(() => {
    async function yuklash() {
      const [tv, mj, sz, sd, sh] = await Promise.all([
        fetch('/api/tovarlar?limit=500').then(r => r.json()),
        fetch('/api/mijozlar').then(r => r.json()),
        fetch('/api/sozlamalar').then(r => r.json()),
        fetch('/api/sherik-dokonlar').then(r => r.json()),
        fetch('/api/sheriklar').then(r => r.json()),
      ])
      setTovarlar(tv.tovarlar || [])
      setMijozlar(mj || [])
      setDokonInfo(sz || {})
      setSherikDokonlar(Array.isArray(sd) ? sd : [])
      setSheriklar(Array.isArray(sh) ? sh : [])
    }
    yuklash()
    // Oxirgi sotuv localStorage dan yuklash
    const saved = localStorage.getItem('oxirgi-sotuv')
    if (saved) { try { setOxirgiSotuv(JSON.parse(saved)) } catch {} }
  }, [])

  const filteredTovarlar = tovarlar.filter(t =>
    t.nomi.toLowerCase().includes(qidiruv.toLowerCase()) ||
    (t.shtrixKod && t.shtrixKod.includes(qidiruv))
  )

  function savatQosh(tovar: Tovar) {
    setSavat(prev => {
      const mavjud = prev.find(s => s.tovarId === tovar.id)
      if (mavjud) {
        return prev.map(s => s.tovarId === tovar.id
          ? { ...s, miqdor: s.miqdor + 1, jami: (s.miqdor + 1) * s.birlikNarxi }
          : s
        )
      }
      return [...prev, {
        tovarId: tovar.id, nomi: tovar.nomi, birlikNarxi: tovar.sotishNarxi,
        miqdor: 1, birlik: tovar.birlik, chegirma: 0,
        jami: tovar.sotishNarxi, mavjudQoldiq: tovar.qoldiq
      }]
    })
  }

  function miqdorOzgartir(tovarId: string, yangiMiqdor: number) {
    if (yangiMiqdor <= 0) {
      setSavat(prev => prev.filter(s => s.tovarId !== tovarId))
      return
    }
    setSavat(prev => prev.map(s => s.tovarId === tovarId
      ? { ...s, miqdor: yangiMiqdor, jami: yangiMiqdor * s.birlikNarxi }
      : s
    ))
  }

  function narxiOzgartir(tovarId: string, yangiNarx: number) {
    if (yangiNarx <= 0) return
    setSavat(prev => prev.map(s => s.tovarId === tovarId
      ? { ...s, birlikNarxi: yangiNarx, jami: s.miqdor * yangiNarx }
      : s
    ))
  }

  function narxTasdiqla(tovarId: string) {
    if (!editNarx) return
    const val = parseFloat(editNarx.val.replace(/\s/g, ''))
    if (!isNaN(val) && val > 0) narxiOzgartir(tovarId, val)
    setEditNarx(null)
  }

  const jamiSumma = savat.reduce((s, i) => s + i.miqdor * i.birlikNarxi, 0)
  const qolBilan = qolBilanSumma ? parseFloat(qolBilanSumma.replace(/\s/g, '')) : NaN
  const yakuniySumma = (!isNaN(qolBilan) && qolBilan >= 0) ? Math.min(jamiSumma, qolBilan) : jamiSumma
  const chegirma = jamiSumma - yakuniySumma

  // Stock yetishmaydigan itemlarni tekshirish
  const ortiqchaItemlar = savat.filter(s => s.miqdor > s.mavjudQoldiq)

  async function sotuvYakunla() {
    if (savat.length === 0) { toast.error('Savat bo\'sh!'); return }
    if (tolovUsuli === 'NASIYA' && !mijozId) { toast.error('Nasiya uchun mijoz tanlang!'); return }
    if (tolovUsuli === 'SHERIK' && !sherikDokonId) { toast.error('Sherik do\'konni tanlang!'); return }

    // Agar stock yetishmasa — sherikdan olish modalni ochish
    if (ortiqchaItemlar.length > 0) {
      setSherikdanOlishlar(ortiqchaItemlar.map(item => ({
        tovarId: item.tovarId,
        tovarNomi: item.nomi,
        ortiqchaMiqdor: item.miqdor - item.mavjudQoldiq,
        narx: item.birlikNarxi,
        sherikId: '',
        yangiSherikIsm: '',
        yangiSherikTelefon: '',
      })))
      setSherikdanOlishModal(true)
      return
    }

    await sotuvYuborish([])
  }

  async function sotuvYuborish(sherikdanOlishData: SherikdanOlishItem[]) {
    setYuklanmoqda(true)
    const naqdQ = tolovUsuli === 'NAQD' ? yakuniySumma : (tolovUsuli === 'ARALASH' ? parseFloat(naqdTolangan || '0') : 0)
    const kartaQ = tolovUsuli === 'KARTA' ? yakuniySumma : (tolovUsuli === 'ARALASH' ? (yakuniySumma - parseFloat(naqdTolangan || '0')) : 0)

    const body: any = {
      mijozId: mijozId || null,
      sherikDokonId: tolovUsuli === 'SHERIK' ? sherikDokonId : null,
      jamiSumma,
      chegirma,
      yakuniySumma,
      tolovUsuli,
      naqdTolangan: naqdQ,
      kartaTolangan: kartaQ,
      nasiyaMuddat: tolovUsuli === 'NASIYA' ? nasiyaMuddat : null,
      tarkiblar: savat.map(s => ({
        tovarId: s.tovarId, miqdor: s.miqdor, birlikNarxi: s.birlikNarxi,
        chegirma: 0, jami: s.miqdor * s.birlikNarxi
      }))
    }

    if (sherikdanOlishData.length > 0) {
      body.sherikdanOlishlar = sherikdanOlishData.map(so => ({
        tovarId: so.tovarId,
        miqdor: so.ortiqchaMiqdor,
        narx: so.narx,
        sherikId: so.sherikId || null,
        yangiSherikIsm: so.yangiSherikIsm || null,
        yangiSherikTelefon: so.yangiSherikTelefon || null,
      }))
    }

    const res = await fetch('/api/sotuvlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setYuklanmoqda(false)

    if (res.ok) {
      const sotuv = await res.json()
      setOxirgiSotuv(sotuv)
      localStorage.setItem('oxirgi-sotuv', JSON.stringify(sotuv))
      setChekModal(true)
      setSavat([])
      setMijozId('')
      setSherikDokonId('')
      setNaqdTolangan('')
      setQolBilanSumma('')
      setTolovUsuli('NAQD')
      setSherikdanOlishModal(false)
      toast.success(`Sotuv yakunlandi! Chek: ${sotuv.chekRaqami}`)
      const [tv, sh] = await Promise.all([
        fetch('/api/tovarlar?limit=500').then(r => r.json()),
        fetch('/api/sheriklar').then(r => r.json()),
      ])
      setTovarlar(tv.tovarlar || [])
      setSheriklar(Array.isArray(sh) ? sh : [])
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Sotuv amalga oshmadi')
    }
  }

  async function sotuvlarYuklash() {
    setSotuvlarYuklanmoqda(true)
    const res = await fetch('/api/sotuvlar?limit=50')
    const data = await res.json()
    setSotuvlarRoyxati(data.sotuvlar || [])
    setSotuvlarYuklanmoqda(false)
  }

  function sotuvTanlash(sotuv: any) {
    setQaytarishSotuv(sotuv)
    const init: Record<string, { miqdor: number; birlikNarxi: number; checked: boolean }> = {}
    for (const t of sotuv.tarkiblar) {
      init[t.tovarId] = { miqdor: Number(t.miqdor), birlikNarxi: Number(t.birlikNarxi), checked: true }
    }
    setQaytarishTanlangan(init)
  }

  async function qaytarishYuborish() {
    if (!qaytarishSotuv) return
    const tarkiblar = qaytarishSotuv.tarkiblar
      .filter((t: any) => qaytarishTanlangan[t.tovarId]?.checked)
      .map((t: any) => {
        const sel = qaytarishTanlandan(t.tovarId)
        return { tovarId: t.tovarId, miqdor: sel.miqdor, birlikNarxi: sel.birlikNarxi, jami: sel.miqdor * sel.birlikNarxi }
      })
    if (tarkiblar.length === 0) { toast.error('Hech narsa tanlanmadi'); return }
    setQaytarishYuklanmoqda(true)
    const res = await fetch('/api/qaytarish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aslSotuvId: qaytarishSotuv.id, tarkiblar, sabab: qaytarishSabab })
    })
    setQaytarishYuklanmoqda(false)
    if (res.ok) {
      toast.success('Qaytarish amalga oshdi!')
      setQaytarishModal(false)
      setQaytarishSotuv(null)
      setQaytarishSabab('')
      const tv = await fetch('/api/tovarlar?limit=500').then(r => r.json())
      setTovarlar(tv.tovarlar || [])
    } else {
      const err = await res.json()
      toast.error(err.xato || 'Xatolik yuz berdi')
    }
  }

  function qaytarishTanlandan(tovarId: string) {
    return qaytarishTanlangan[tovarId] || { miqdor: 0, birlikNarxi: 0, checked: false }
  }

  function chekHtml(s: any) {
    const dokonNomi = dokonInfo.dokon_nomi || "Do'kon"
    const manzil = dokonInfo.manzil || ''
    const tel = dokonInfo.telefon || ''
    const chekMatn = dokonInfo.chek_matn || ''
    const kassirTel = s.kassir?.telefon || ''
    const chekEni = dokonInfo.chek_eni === '58' ? 58 : 80
    const chekPx = chekEni === 58 ? 218 : 302
    const sz = chekEni === 58 ? 11 : 12
    const tovarlarHtml = s.tarkiblar?.map((t: any) => {
      const nomi = t.tovar?.nomi || '—'
      const miqdor = Number(t.miqdor)
      const narx = formatSum(t.birlikNarxi)
      const jami = formatSum(t.jami)
      return `<tr><td>${nomi}</td><td style="text-align:right">${miqdor} x ${narx}</td></tr><tr><td></td><td style="text-align:right;font-weight:bold">${jami}</td></tr>`
    }).join('') || ''
    const chegirmaHtml = Number(s.chegirma) > 0
      ? `<tr><td>Chegirma:</td><td style="text-align:right;color:#666">-${formatSum(s.chegirma)}</td></tr>` : ''
    const tolov = s.tolovUsuli === 'ARALASH'
      ? `<tr><td>Naqd:</td><td style="text-align:right">${formatSum(s.naqdTolangan)}</td></tr><tr><td>Karta:</td><td style="text-align:right">${formatSum(s.kartaTolangan)}</td></tr>`
      : s.tolovUsuli === 'NASIYA'
      ? `<tr><td>To'lov:</td><td style="text-align:right">Nasiya</td></tr><tr><td>Mijoz:</td><td style="text-align:right">${s.mijoz?.ism || '—'}</td></tr>`
      : `<tr><td>To'lov:</td><td style="text-align:right">${s.tolovUsuli === 'KARTA' ? 'Karta' : 'Naqd pul'}</td></tr>`
    const kassirHtml = kassirTel ? `<div>Kassir tel: ${kassirTel}</div>` : ''
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chek ${s.chekRaqami}</title>
<style>
  @page{size:${chekEni}mm auto;margin:0}
  body{font-family:'Courier New',Consolas,monospace;font-size:${sz}px;width:${chekPx}px;margin:0 auto;padding:6px;color:#000;background:#fff}
  table{width:100%;border-collapse:collapse}td{vertical-align:top;padding:1px 0;font-size:${sz}px}
  .center{text-align:center}.bold{font-weight:bold}.sep{border-top:1px dashed #000;margin:4px 0}
  .total td{font-weight:bold;font-size:${sz + 1}px}
</style></head><body>
<div class="center bold" style="font-size:${sz + 2}px">${dokonNomi}</div>
${manzil ? `<div class="center">${manzil}</div>` : ''}
${tel ? `<div class="center">Tel: ${tel}</div>` : ''}
<div class="sep"></div>
<div>Chek: ${s.chekRaqami}</div>
<div>Sana: ${formatSanaVaVaqt(s.sana)}</div>
${kassirHtml}
<div class="sep"></div>
<table>${tovarlarHtml}</table>
<div class="sep"></div>
<table>${chegirmaHtml}<tr class="total"><td>JAMI:</td><td style="text-align:right">${formatSum(s.yakuniySumma)}</td></tr></table>
<div class="sep"></div>
<table>${tolov}</table>
${chekMatn ? `<div class="sep"></div><div class="center" style="font-size:${sz - 1}px">${chekMatn}</div>` : ''}
<div class="sep"></div>
<div class="center" style="font-size:10px">Rahmat!</div>
</body></html>`
  }

  function chekChopEtish(s: any) {
    const win = window.open('', '_blank', 'width=340,height=700')
    if (!win) { toast.error('Popup bloklanmoqda'); return }
    win.document.write(chekHtml(s))
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Mobile tab switcher */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-neutral-800 mb-0">
        <button
          onClick={() => setMobileTab('tovarlar')}
          className={`flex-1 py-2.5 text-sm font-medium ${mobileTab === 'tovarlar' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Tovarlar
        </button>
        <button
          onClick={() => setMobileTab('savat')}
          className={`flex-1 py-2.5 text-sm font-medium relative ${mobileTab === 'savat' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Savat {savat.length > 0 && <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1.5">{savat.length}</span>}
        </button>
      </div>

      {/* Chap: Tovarlar */}
      <div className={`flex-1 flex flex-col gap-4 min-w-0 lg:flex ${mobileTab === 'tovarlar' ? 'flex' : 'hidden'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
          <input
            value={qidiruv}
            onChange={e => setQidiruv(e.target.value)}
            placeholder="Tovar qidirish yoki shtrix-kod..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
            {filteredTovarlar.map(t => (
              <button
                key={t.id}
                onClick={() => savatQosh(t)}
                className="text-left p-3 bg-gray-50 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 rounded-xl transition border border-gray-200 dark:border-neutral-700"
              >
                <p className="text-gray-900 dark:text-gray-100 text-sm font-medium leading-tight">{t.nomi}</p>
                <p className="text-red-600 text-sm font-bold mt-1">{formatSum(t.sotishNarxi)}</p>
                <p className={`text-xs mt-0.5 ${t.qoldiq <= 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-600'}`}>
                  Qoldiq: {t.qoldiq} {t.birlik.toLowerCase()}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* O'ng: Savat */}
      <div className={`lg:w-96 flex flex-col gap-3 lg:flex ${mobileTab === 'savat' ? 'flex' : 'hidden'}`}>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl flex-1 min-h-0">
          <div className="p-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-gray-500 dark:text-gray-500" />
              <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-sm">Savat ({savat.length})</h2>
            </div>
            <div className="flex items-center gap-1">
              {oxirgiSotuv && (
                <button
                  onClick={() => setChekModal(true)}
                  className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition"
                  title="Oxirgi chek"
                >
                  <Clock size={15} />
                </button>
              )}
              <button
                onClick={() => { setQaytarishModal(true); setQaytarishSotuv(null); setSotuvQidiruv(''); sotuvlarYuklash() }}
                className="p-1.5 text-gray-400 dark:text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition"
                title="Qaytarish"
              >
                <RotateCcw size={15} />
              </button>
              {savat.length > 0 && (
                <button onClick={() => setSavat([])} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {savat.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-600">
              <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Savat bo&apos;sh</p>
              <p className="text-xs mt-1">Tovar tanlang</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-72">
              {savat.map(item => {
                const isNarxOzgartirilgan = item.birlikNarxi !== tovarlar.find(t => t.id === item.tovarId)?.sotishNarxi
                const isEditing = editNarx?.tovarId === item.tovarId
                return (
                <div key={item.tovarId} className="px-3 py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
                  {/* Row 1: nomi + delete */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <p className="text-gray-900 dark:text-gray-100 text-sm font-medium leading-tight flex-1 truncate" title={item.nomi}>{item.nomi}</p>
                    <button onClick={() => miqdorOzgartir(item.tovarId, 0)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition shrink-0 ml-1">
                      <X size={13} />
                    </button>
                  </div>
                  {/* Row 2: [narx input] × [miqdor] = [jami] */}
                  <div className="flex items-center gap-1.5">
                    {/* Narx — always editable input */}
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={isEditing ? editNarx.val : String(item.birlikNarxi).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                        onFocus={e => { setEditNarx({ tovarId: item.tovarId, val: String(item.birlikNarxi) }); e.target.select() }}
                        onChange={e => setEditNarx({ tovarId: item.tovarId, val: e.target.value.replace(/[^\d]/g, '') })}
                        onBlur={() => narxTasdiqla(item.tovarId)}
                        onKeyDown={e => { if (e.key === 'Enter') { narxTasdiqla(item.tovarId); (e.target as HTMLInputElement).blur() } if (e.key === 'Escape') setEditNarx(null) }}
                        title="Narxni o'zgartirish mumkin"
                        className={`w-full h-7 pl-2 pr-5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-400 transition
                          ${isNarxOzgartirilgan
                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                            : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                          }`}
                      />
                      <Pencil size={9} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${isNarxOzgartirilgan ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    </div>
                    <span className="text-gray-400 dark:text-gray-600 text-xs shrink-0">×</span>
                    <input
                      type="number"
                      min={0.001}
                      step="any"
                      value={item.miqdor}
                      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) miqdorOzgartir(item.tovarId, v) }}
                      onFocus={e => e.target.select()}
                      onWheel={e => e.currentTarget.blur()}
                      style={{ MozAppearance: 'textfield' } as React.CSSProperties}
                      className="w-14 h-7 text-center text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shrink-0"
                    />
                    <span className="text-gray-400 dark:text-gray-600 text-xs shrink-0">=</span>
                    <span className="text-green-600 text-sm font-bold shrink-0 min-w-[65px] text-right">{formatSum(item.jami)}</span>
                  </div>
                  {item.miqdor > item.mavjudQoldiq && (
                    <div className="flex items-center gap-1 mt-1.5 text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={11} />
                      <span className="text-[10px]">Qoldiq: {item.mavjudQoldiq}, ortiqcha: {+(item.miqdor - item.mavjudQoldiq).toFixed(3)} (sherikdan olinadi)</span>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* To'lov */}
        {savat.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500">
              <span>Hisoblangan jami:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{formatSum(jamiSumma)}</span>
            </div>

            {/* Umumiy summa o'zgartirish */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">Yakuniy summa:</span>
              <input
                type="text"
                inputMode="numeric"
                value={qolBilanSumma}
                onChange={e => setQolBilanSumma(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={String(Math.round(jamiSumma))}
                className="flex-1 px-2 py-1 text-sm text-right bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>

            {chegirma > 0 && (
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                <span>Chegirma:</span><span>-{formatSum(chegirma)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold border-t border-gray-100 dark:border-neutral-800 pt-2">
              <span className="text-gray-900 dark:text-gray-100">To&apos;lov:</span>
              <span className="text-green-600 text-lg">{formatSum(yakuniySumma)}</span>
            </div>

            {/* To'lov usuli */}
            <div className="grid grid-cols-2 gap-1.5">
              {TOLOV_USULLARI.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTolovUsuli(t.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition ${
                    tolovUsuli === t.value
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {(tolovUsuli === 'NASIYA' || tolovUsuli === 'ARALASH') && (
              <div className="space-y-1.5">
                <p className="text-gray-500 dark:text-gray-500 text-xs">Mijoz tanlang *</p>
                <Combobox
                  options={mijozlar.map(m => ({ value: m.id, label: `${m.ism}${m.telefon ? ' — ' + m.telefon : ''}` }))}
                  value={mijozId}
                  onChange={setMijozId}
                  placeholder="Mijoz tanlang"
                  searchPlaceholder="Mijoz qidirish..."
                />
              </div>
            )}

            {tolovUsuli === 'SHERIK' && (
              <div className="space-y-1.5">
                <p className="text-gray-500 dark:text-gray-500 text-xs">Sherik do&apos;kon *</p>
                <Combobox
                  options={sherikDokonlar.map(s => ({ value: s.id, label: `${s.nomi}${s.telefon ? ' — ' + s.telefon : ''}` }))}
                  value={sherikDokonId}
                  onChange={setSherikDokonId}
                  placeholder="Do'kon tanlang"
                  searchPlaceholder="Do'kon qidirish..."
                />
              </div>
            )}

            {tolovUsuli === 'NASIYA' && (
              <div>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-1">Nasiya muddati</p>
                <input type="date" value={nasiyaMuddat} onChange={e => setNasiyaMuddat(e.target.value)} className={inputCls} />
              </div>
            )}

            {tolovUsuli === 'ARALASH' && (
              <div>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-1">Naqd qism</p>
                <MoneyInput
                  value={naqdTolangan}
                  onChange={setNaqdTolangan}
                  max={yakuniySumma}
                  min={0}
                  placeholder="0"
                />
                {naqdTolangan && (
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                    Karta: {formatSum(yakuniySumma - parseFloat(naqdTolangan || '0'))}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={sotuvYakunla}
              disabled={yuklanmoqda}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded-xl transition text-base shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {yuklanmoqda ? 'Amalga oshirilmoqda...' : 'Sotuvni yakunlash'}
            </button>
          </div>
        )}
      </div>

      {/* Chek modal */}
      {chekModal && oxirgiSotuv && (() => {
        const s = oxirgiSotuv
        const dokonNomi = dokonInfo.dokon_nomi || "Do'kon"
        const manzil = dokonInfo.manzil || ''
        const tel = dokonInfo.telefon || ''
        const chekMatn = dokonInfo.chek_matn || ''
        const kassirTel = s.kassir?.telefon || ''

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-sm overflow-hidden">
              <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-white shrink-0" />
                <div>
                  <p className="text-white font-bold">Sotuv amalga oshdi!</p>
                  <p className="text-red-200 text-xs">{s.chekRaqami}</p>
                </div>
              </div>

              <div className="chek-print bg-white max-h-[55vh] overflow-y-auto" style={{ fontFamily: "'Courier New', Consolas, monospace", fontSize: 12, color: '#000', width: '100%', padding: '12px 16px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>{dokonNomi}</div>
                {manzil && <div style={{ textAlign: 'center', fontSize: 11, marginBottom: 1 }}>{manzil}</div>}
                {tel && <div style={{ textAlign: 'center', fontSize: 11 }}>Tel: {tel}</div>}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                <div>Chek: {s.chekRaqami}</div>
                <div>Sana: {formatSanaVaVaqt(s.sana)}</div>
                {kassirTel && <div>Kassir tel: {kassirTel}</div>}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                {s.tarkiblar?.map((t: any) => (
                  <div key={t.id} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1 }}>{t.tovar?.nomi || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#555' }}>{Number(t.miqdor)} × {formatSum(t.birlikNarxi)}</span>
                      <span style={{ fontWeight: 'bold' }}>{formatSum(t.jami)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                {Number(s.chegirma) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Chegirma:</span><span>-{formatSum(s.chegirma)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13 }}>
                  <span>JAMI:</span><span>{formatSum(s.yakuniySumma)}</span>
                </div>
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                {s.tolovUsuli === 'ARALASH' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Naqd:</span><span>{formatSum(s.naqdTolangan)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Karta:</span><span>{formatSum(s.kartaTolangan)}</span></div>
                  </>
                ) : s.tolovUsuli === 'NASIYA' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>To&apos;lov:</span><span>Nasiya</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mijoz:</span><span>{s.mijoz?.ism || '—'}</span></div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>To&apos;lov:</span><span>{s.tolovUsuli === 'KARTA' ? 'Karta' : 'Naqd pul'}</span>
                  </div>
                )}
                {chekMatn && (
                  <>
                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                    <div style={{ textAlign: 'center', fontSize: 11 }}>{chekMatn}</div>
                  </>
                )}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                <div style={{ textAlign: 'center', fontSize: 11 }}>Rahmat!</div>
              </div>

              <div className="p-4 flex gap-2">
                <button
                  onClick={() => chekChopEtish(s)}
                  className="flex-1 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400"
                >
                  <Printer size={14} />
                  Chop etish
                </button>
                <button
                  onClick={() => chekChopEtish(s)}
                  className="flex-1 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400"
                >
                  <Download size={14} />
                  PDF
                </button>
                <button
                  onClick={() => setChekModal(false)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm transition font-medium"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Sherikdan olish modal */}
      {sherikdanOlishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Sherikdan olish</h3>
              </div>
              <button onClick={() => setSherikdanOlishModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                Quyidagi tovarlar omborda yetarli emas. Har biri uchun sherik tanlang yoki yangi sherik kiriting.
              </p>

              {sherikdanOlishlar.map((item, idx) => (
                <div key={item.tovarId} className="border border-gray-200 dark:border-neutral-700 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{item.tovarNomi}</span>
                    <span className="text-amber-600 text-xs font-medium">
                      Ortiqcha: {item.ortiqchaMiqdor} dona × {formatSum(item.narx)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Sherik tanlang</label>
                    <Combobox
                      options={sheriklar.map(s => ({ value: s.id, label: `${s.ism}${s.telefon ? ' — ' + s.telefon : ''}` }))}
                      value={item.sherikId}
                      onChange={val => {
                        setSherikdanOlishlar(prev => prev.map((so, i) =>
                          i === idx ? { ...so, sherikId: val, yangiSherikIsm: '', yangiSherikTelefon: '' } : so
                        ))
                      }}
                      placeholder="Mavjud sherik tanlang"
                      searchPlaceholder="Sherik qidirish..."
                    />
                  </div>

                  {!item.sherikId && (
                    <div className="space-y-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Yoki yangi sherik:</p>
                      <input
                        value={item.yangiSherikIsm}
                        onChange={e => setSherikdanOlishlar(prev => prev.map((so, i) =>
                          i === idx ? { ...so, yangiSherikIsm: e.target.value } : so
                        ))}
                        placeholder="Ism (majburiy)"
                        className={inputCls}
                      />
                      <input
                        value={item.yangiSherikTelefon}
                        onChange={e => setSherikdanOlishlar(prev => prev.map((so, i) =>
                          i === idx ? { ...so, yangiSherikTelefon: e.target.value } : so
                        ))}
                        placeholder="Telefon (ixtiyoriy)"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSherikdanOlishModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={yuklanmoqda || sherikdanOlishlar.some(so => !so.sherikId && !so.yangiSherikIsm)}
                  onClick={() => sotuvYuborish(sherikdanOlishlar)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                  {yuklanmoqda ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Sotuvni yakunlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Qaytarish modal */}
      {qaytarishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:border dark:border-neutral-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-600" />
                <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Qaytarish</h3>
              </div>
              <button onClick={() => setQaytarishModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Chek tanlash */}
              {!qaytarishSotuv && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Chekni tanlang</label>
                    {sotuvlarYuklanmoqda && <Loader2 size={14} className="animate-spin text-gray-400" />}
                  </div>
                  <input
                    value={sotuvQidiruv}
                    onChange={e => setSotuvQidiruv(e.target.value)}
                    placeholder="Chek raqami yoki mijoz nomi..."
                    className={`${inputCls} mb-2`}
                  />
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {sotuvlarRoyxati
                      .filter(s =>
                        !sotuvQidiruv ||
                        s.chekRaqami.toLowerCase().includes(sotuvQidiruv.toLowerCase()) ||
                        (s.mijoz?.ism?.toLowerCase().includes(sotuvQidiruv.toLowerCase()))
                      )
                      .map(s => (
                        <button
                          key={s.id}
                          onClick={() => sotuvTanlash(s)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">{s.chekRaqami}</span>
                            <span className="text-green-600 text-sm font-bold">{formatSum(s.yakuniySumma)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-gray-400 dark:text-gray-600 text-xs">{formatSanaVaVaqt(s.sana)}</span>
                            {s.mijoz && <span className="text-gray-500 dark:text-gray-500 text-xs">{s.mijoz.ism}</span>}
                          </div>
                        </button>
                      ))
                    }
                    {!sotuvlarYuklanmoqda && sotuvlarRoyxati.length === 0 && (
                      <p className="text-gray-400 dark:text-gray-600 text-sm text-center py-4">Sotuvlar topilmadi</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tanlangan sotuv */}
              {qaytarishSotuv && (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{qaytarishSotuv.chekRaqami}</span>
                      <button
                        onClick={() => setQaytarishSotuv(null)}
                        className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 hover:underline"
                      >
                        ← Orqaga
                      </button>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Sana:</span><span>{formatSanaVaVaqt(qaytarishSotuv.sana)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Jami:</span><span className="text-green-600 font-bold">{formatSum(qaytarishSotuv.yakuniySumma)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Qaytariladigan mahsulotlar:</p>
                    {qaytarishSotuv.tarkiblar.map((t: any) => {
                      const sel = qaytarishTanlandan(t.tovarId)
                      return (
                        <div key={t.tovarId} className="border border-gray-200 dark:border-neutral-700 rounded-xl p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={sel.checked}
                              onChange={e => setQaytarishTanlangan(prev => ({
                                ...prev,
                                [t.tovarId]: { ...sel, checked: e.target.checked }
                              }))}
                              className="w-4 h-4 accent-red-600"
                            />
                            <span className="text-gray-900 dark:text-gray-100 text-sm font-medium flex-1">{t.tovar?.nomi || '—'}</span>
                            <span className="text-gray-400 dark:text-gray-600 text-xs">max: {Number(t.miqdor)}</span>
                          </div>
                          {sel.checked && (
                            <div className="grid grid-cols-2 gap-2 ml-7">
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 block">Miqdor</label>
                                <input
                                  type="number"
                                  min={0.001}
                                  max={Number(t.miqdor)}
                                  step="any"
                                  value={sel.miqdor}
                                  onChange={e => setQaytarishTanlangan(prev => ({
                                    ...prev,
                                    [t.tovarId]: { ...sel, miqdor: parseFloat(e.target.value) || 0 }
                                  }))}
                                  onWheel={e => e.currentTarget.blur()}
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 block">Narx (so&apos;m)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={sel.birlikNarxi}
                                  onChange={e => setQaytarishTanlangan(prev => ({
                                    ...prev,
                                    [t.tovarId]: { ...sel, birlikNarxi: parseFloat(e.target.value) || 0 }
                                  }))}
                                  onWheel={e => e.currentTarget.blur()}
                                  className={inputCls}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1 block">Sabab (ixtiyoriy)</label>
                    <input
                      value={qaytarishSabab}
                      onChange={e => setQaytarishSabab(e.target.value)}
                      placeholder="Qaytarish sababi..."
                      className={inputCls}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setQaytarishModal(false)}
                      className="flex-1 py-2.5 border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium">
                      Bekor qilish
                    </button>
                    <button type="button" onClick={qaytarishYuborish} disabled={qaytarishYuklanmoqda}
                      className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                      {qaytarishYuklanmoqda ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                      Qaytarish
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
