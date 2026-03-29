'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { formatSum } from '@/lib/utils'
import { normalizeUzbek } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, ShoppingCart, Trash2, Send, X, Package, Plus, Minus, User, ChevronRight, Camera, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface Tovar {
  id: string
  nomi: string
  shtrixKod: string | null
  sotishNarxi: number
  birlik: string
  qoldiq: number
  kategoriya: { nomi: string }
}

interface SavatItem {
  tovarId: string
  nomi: string
  birlikNarxi: number
  miqdor: number
  birlik: string
  jami: number
}

interface Mijoz {
  id: string
  ism: string
  telefon: string | null
}

const ODDIY_MIJOZ: Mijoz = { id: '', ism: 'Oddiy mijoz', telefon: null }

export default function SotuvchiPage() {
  const [tovarlar, setTovarlar] = useState<Tovar[]>([])
  const [qidiruv, setQidiruv] = useState('')
  const [savat, setSavat] = useState<SavatItem[]>([])
  const [savatOchiq, setSavatOchiq] = useState(false)
  const [yuklash, setYuklash] = useState(false)
  const [yuborYuklash, setYuborYuklash] = useState(false)

  // Numpad modal
  const [numpadTovar, setNumpadTovar] = useState<Tovar | null>(null)
  const [numpadQiymat, setNumpadQiymat] = useState('1')

  // Mijoz tanlash modal
  const [mijozModalOchiq, setMijozModalOchiq] = useState(false)
  const [tanlanganMijoz, setTanlanganMijoz] = useState<Mijoz>(ODDIY_MIJOZ)
  const [mijozQidiruv, setMijozQidiruv] = useState('')
  const [mijozlar, setMijozlar] = useState<Mijoz[]>([])
  const [mijozYuklash, setMijozYuklash] = useState(false)
  const mijozQidiruvRef = useRef<HTMLInputElement>(null)

  // QR skaner
  const [qrOchiq, setQrOchiq] = useState(false)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)

  const qidiruvRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setYuklash(true)
      const res = await fetch('/api/tovarlar?limit=9999&holati=FAOL').then(r => r.json())
      setTovarlar(res.tovarlar || [])
      setYuklash(false)
    }
    load()
    qidiruvRef.current?.focus()
  }, [])

  // Mijoz qidiruv
  useEffect(() => {
    if (!mijozModalOchiq) return
    const timer = setTimeout(async () => {
      setMijozYuklash(true)
      const res = await fetch(`/api/mijozlar?q=${encodeURIComponent(mijozQidiruv)}`).then(r => r.json())
      setMijozlar(res.mijozlar || res || [])
      setMijozYuklash(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [mijozQidiruv, mijozModalOchiq])

  // Barcode scanner listener — global keydown
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.activeElement === qidiruvRef.current) return
      if (numpadTovar) return
      if (mijozModalOchiq) return

      if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim()
        barcodeBuffer.current = ''
        clearTimeout(barcodeTimer.current)
        if (code.length >= 2) {
          const found = tovarlar.find(t => t.shtrixKod === code)
          if (found) ochNumpad(found)
          else toast.error(`"${code}" kodli tovar topilmadi`)
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tovarlar, numpadTovar, mijozModalOchiq])

  const filteredTovarlar = qidiruv.trim()
    ? tovarlar.filter(t => {
        const q = normalizeUzbek(qidiruv.toLowerCase())
        return normalizeUzbek(t.nomi.toLowerCase()).includes(q) ||
          (t.shtrixKod || '').includes(qidiruv.trim())
      })
    : tovarlar

  function ochNumpad(tovar: Tovar) {
    setNumpadTovar(tovar)
    setNumpadQiymat('1')
    setQidiruv('')
  }

  function numpadPress(val: string) {
    setNumpadQiymat(prev => {
      if (val === '⌫') return prev.length > 1 ? prev.slice(0, -1) : '0'
      if (val === 'C') return '0'
      if (prev === '0') return val
      return prev + val
    })
  }

  function numpadTasdiqlash() {
    if (!numpadTovar) return
    const miqdor = parseFloat(numpadQiymat) || 0
    if (miqdor <= 0) { toast.error('Miqdor 0 dan katta bo\'lsin'); return }

    setSavat(prev => {
      const existing = prev.find(s => s.tovarId === numpadTovar.id)
      if (existing) {
        return prev.map(s => s.tovarId === numpadTovar.id
          ? { ...s, miqdor: s.miqdor + miqdor, jami: (s.miqdor + miqdor) * s.birlikNarxi }
          : s
        )
      }
      return [...prev, {
        tovarId: numpadTovar.id,
        nomi: numpadTovar.nomi,
        birlikNarxi: Number(numpadTovar.sotishNarxi),
        miqdor,
        birlik: numpadTovar.birlik,
        jami: miqdor * Number(numpadTovar.sotishNarxi),
      }]
    })
    setNumpadTovar(null)
    toast.success(`${numpadTovar.nomi} savatga qo'shildi`)
  }

  function savatdanOchir(tovarId: string) {
    setSavat(prev => prev.filter(s => s.tovarId !== tovarId))
  }

  function miqdorOzgartir(tovarId: string, delta: number) {
    setSavat(prev => prev.map(s => {
      if (s.tovarId !== tovarId) return s
      const yangi = Math.max(0, s.miqdor + delta)
      if (yangi === 0) return s
      return { ...s, miqdor: yangi, jami: yangi * s.birlikNarxi }
    }))
  }

  const jamiSumma = savat.reduce((s, i) => s + i.jami, 0)

  // QR skaner
  const qrBoshlash = useCallback(async () => {
    setQrOchiq(true)
    // Kutib turish — DOM element paydo bo'lgunicha
    await new Promise(r => setTimeout(r, 100))

    try {
      const scanner = new Html5Qrcode('qr-reader-sotuvchi')
      qrScannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (kod) => {
          // Skanlangan kod — mahsulotni qidirish
          const found = tovarlar.find(t => t.shtrixKod === kod || t.id === kod)
          if (found) {
            ochNumpad(found)
            toast.success(`${found.nomi} topildi!`)
          } else {
            toast.error(`"${kod}" kodli tovar topilmadi`)
          }
          // Skanerni to'xtatish
          scanner.stop().catch(() => {})
          setQrOchiq(false)
        },
        () => {}
      )
    } catch (err: any) {
      toast.error('Kamerani ishga tushirib bo\'lmadi')
      setQrOchiq(false)
    }
  }, [tovarlar])

  const qrToxtatish = useCallback(async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop().catch(() => {})
    }
    setQrOchiq(false)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  function ochMijozModal() {
    setMijozModalOchiq(true)
    setMijozQidiruv('')
    setTimeout(() => mijozQidiruvRef.current?.focus(), 100)
  }

  function tanla(mijoz: Mijoz) {
    setTanlanganMijoz(mijoz)
    setMijozModalOchiq(false)
  }

  async function kassagaYuborish() {
    if (savat.length === 0) return
    setYuborYuklash(true)
    try {
      const res = await fetch('/api/buyurtmalar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarkiblar: savat.map(s => ({
            tovarId: s.tovarId,
            miqdor: s.miqdor,
            birlikNarxi: s.birlikNarxi,
            jami: s.jami,
          })),
          mijozId: tanlanganMijoz.id || null,
        })
      })
      if (res.ok) {
        toast.success('Buyurtma kassirga yuborildi!')
        setSavat([])
        setSavatOchiq(false)
        setTanlanganMijoz(ODDIY_MIJOZ)
      } else {
        const d = await res.json()
        toast.error(d.xato || 'Xatolik')
      }
    } catch {
      toast.error('Xatolik yuz berdi')
    }
    setYuborYuklash(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

      {/* Search + QR */}
      <div className="p-3 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={qidiruvRef}
              value={qidiruv}
              onChange={e => setQidiruv(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredTovarlar.length === 1) ochNumpad(filteredTovarlar[0])
              }}
              placeholder="Mahsulot nomi yoki kodi..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-gray-100"
              autoComplete="off"
            />
            {qidiruv && (
              <button onClick={() => setQidiruv('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSavatOchiq(true)}
            className="shrink-0 h-11 flex items-center gap-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl px-4 transition font-medium text-sm"
          >
            <ShoppingCart size={16} />
            {savat.length > 0 && (
              <span className="bg-white/20 text-xs font-bold px-1.5 py-0.5 rounded-full">{savat.length}</span>
            )}
            {savat.length > 0 && <span className="hidden sm:inline font-bold">{formatSum(jamiSumma)}</span>}
          </button>
          <button
            onClick={qrOchiq ? qrToxtatish : qrBoshlash}
            className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition active:scale-95 ${
              qrOchiq
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
            title="QR kod skanerlash"
          >
            {qrOchiq ? <CameraOff size={18} /> : <Camera size={18} />}
          </button>
        </div>

        {/* QR kamera oynasi */}
        {qrOchiq && (
          <div className="relative bg-black rounded-xl overflow-hidden">
            <div id="qr-reader-sotuvchi" className="w-full" />
            <p className="absolute bottom-2 left-0 right-0 text-center text-white/70 text-xs">
              QR yoki shtrix kodni kameraga ko'rsating
            </p>
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {yuklash ? (
          <div className="text-center text-gray-400 py-16">Yuklanmoqda...</div>
        ) : filteredTovarlar.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>Tovar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredTovarlar.map(t => (
              <button
                key={t.id}
                onClick={() => ochNumpad(t)}
                className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-left hover:border-red-400 hover:shadow-md active:scale-95 transition-all"
              >
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 mb-2">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(100, (t.qoldiq / 100) * 100)}%` }} />
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-semibold text-xs leading-tight line-clamp-2 mb-1">{t.nomi}</p>
                <p className="text-red-600 font-bold text-sm">{formatSum(t.sotishNarxi)}</p>
                <p className="text-gray-400 text-xs mt-0.5">{t.qoldiq} {t.birlik.toLowerCase()}</p>
              </button>
            ))}
          </div>
        )}
      </div>


      {/* Savat slide-up */}
      {savatOchiq && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setSavatOchiq(false)} />
          <div className="bg-white dark:bg-neutral-900 rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCart size={18} className="text-red-500" />
                Savat ({savat.length} ta)
              </h2>
              <button onClick={() => setSavatOchiq(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {savat.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Savat bo'sh</p>
              ) : savat.map(item => (
                <div key={item.tovarId} className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-sm truncate">{item.nomi}</p>
                    <p className="text-gray-500 text-xs">{formatSum(item.birlikNarxi)} × {item.miqdor}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => miqdorOzgartir(item.tovarId, -1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg hover:bg-gray-300 transition">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-gray-100">{item.miqdor}</span>
                    <button onClick={() => miqdorOzgartir(item.tovarId, 1)} className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-neutral-700 rounded-lg hover:bg-gray-300 transition">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-red-600 font-bold text-sm">{formatSum(item.jami)}</p>
                  </div>
                  <button onClick={() => savatdanOchir(item.tovarId)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {savat.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-neutral-800 space-y-3">
                {/* Mijoz tanlash */}
                <button
                  onClick={ochMijozModal}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 hover:border-red-400 transition"
                >
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <div className="text-left">
                      <p className="text-xs text-gray-400">Mijoz</p>
                      <p className={`text-sm font-medium ${tanlanganMijoz.id ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {tanlanganMijoz.ism}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Jami:</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatSum(jamiSumma)}</span>
                </div>
                <button
                  onClick={kassagaYuborish}
                  disabled={yuborYuklash}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl py-3.5 font-semibold transition"
                >
                  <Send size={18} />
                  {yuborYuklash ? 'Yuborilmoqda...' : 'Kassaga yuborish'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mijoz tanlash modal */}
      {mijozModalOchiq && (
        <div className="fixed inset-0 z-[60] flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setMijozModalOchiq(false)} />
          <div className="bg-white dark:bg-neutral-900 rounded-t-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User size={18} className="text-red-500" />
                Mijoz tanlash
              </h2>
              <button onClick={() => setMijozModalOchiq(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={mijozQidiruvRef}
                  value={mijozQidiruv}
                  onChange={e => setMijozQidiruv(e.target.value)}
                  placeholder="Ism yoki telefon..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Oddiy mijoz — doim birinchi */}
              <button
                onClick={() => tanla(ODDIY_MIJOZ)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition border-b border-gray-100 dark:border-neutral-800 ${tanlanganMijoz.id === '' ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                  <User size={16} className="text-gray-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Oddiy mijoz</p>
                  <p className="text-xs text-gray-400">Mijoz tanlanmagan</p>
                </div>
                {tanlanganMijoz.id === '' && <span className="ml-auto text-red-500 text-xs font-semibold">Tanlangan</span>}
              </button>

              {mijozYuklash ? (
                <div className="text-center text-gray-400 py-8 text-sm">Yuklanmoqda...</div>
              ) : mijozlar.length === 0 && mijozQidiruv ? (
                <div className="text-center text-gray-400 py-8 text-sm">Mijoz topilmadi</div>
              ) : (
                mijozlar.map(m => (
                  <button
                    key={m.id}
                    onClick={() => tanla(m)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition border-b border-gray-100 dark:border-neutral-800 ${tanlanganMijoz.id === m.id ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <span className="text-red-600 font-bold text-sm">{m.ism[0].toUpperCase()}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{m.ism}</p>
                      {m.telefon && <p className="text-xs text-gray-400">{m.telefon}</p>}
                    </div>
                    {tanlanganMijoz.id === m.id && <span className="ml-auto text-red-500 text-xs font-semibold">Tanlangan</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Numpad Modal */}
      {numpadTovar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-4 text-white">
              <button onClick={() => setNumpadTovar(null)} className="float-right opacity-70 hover:opacity-100">
                <X size={20} />
              </button>
              <p className="text-red-100 text-xs uppercase tracking-wider mb-1">Mahsulot</p>
              <p className="font-bold text-lg leading-tight">{numpadTovar.nomi}</p>
              <p className="text-red-100 text-sm mt-1">{formatSum(numpadTovar.sotishNarxi)} / {numpadTovar.birlik.toLowerCase()}</p>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Miqdor</p>
              <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-wider">{numpadQiymat}</div>
              {numpadQiymat !== '0' && (
                <p className="text-red-600 font-semibold mt-1">
                  = {formatSum(parseFloat(numpadQiymat) * Number(numpadTovar.sotishNarxi))}
                </p>
              )}
            </div>

            <div className="p-4 grid grid-cols-3 gap-2">
              {['7','8','9','4','5','6','1','2','3','⌫','0','✓'].map(btn => (
                <button
                  key={btn}
                  onClick={() => btn === '✓' ? numpadTasdiqlash() : numpadPress(btn)}
                  className={`
                    h-14 rounded-xl font-bold text-xl transition active:scale-95
                    ${btn === '✓'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : btn === '⌫'
                      ? 'bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-200'
                      : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100'
                    }
                  `}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
