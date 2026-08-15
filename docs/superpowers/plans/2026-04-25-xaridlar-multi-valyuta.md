# Xaridlar Multi-Valyuta (USD/UZS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xaridlar modulida USD va UZS valyutalarini qo'shish — har xarid o'z valyutasida saqlanadi, kurs aylantirish yo'q.

**Architecture:** Bitta xarid = bitta valyuta. Xarid valyutasi `Xarid.valyuta` enum maydonida saqlanadi (default `UZS`). Tarkib, qarz, to'lov — barchasi shu valyutada. Frontend'da valyuta toggle, summary kartalar (per-currency), filter, valyuta-bilan-format.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, TypeScript, React, Tailwind, vitest.

**Spec:** [2026-04-25-xaridlar-multi-valyuta-design.md](../specs/2026-04-25-xaridlar-multi-valyuta-design.md)

---

## File Structure

### Yangi fayllar
- `prisma/migrations/<timestamp>_add_valyuta/migration.sql` — auto-generate
- `test/unit/format-pul.test.ts` — `formatPul` testlari
- `src/app/api/xaridlar/summary/route.ts` — yangi endpoint
- `test/integration/api-xaridlar-valyuta.test.ts` — API integration testlari

### O'zgartiriladigan fayllar
- `prisma/schema.prisma` — `Valyuta` enum, `Xarid.valyuta` field
- `src/lib/utils.ts` — `formatPul()` qo'shish
- `src/components/ui/money-input.tsx` — `valyuta` prop qo'shish
- `src/app/api/xaridlar/route.ts` — POST/GET valyuta qo'llab-quvvatlash
- `src/app/(dashboard)/xaridlar/page.tsx` — UI: toggle, filter, summary, format

---

## Phase 1: Database Schema

### Task 1: Schema'ga `Valyuta` enum va `Xarid.valyuta` qo'shish

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: `Valyuta` enum qo'shish**

`prisma/schema.prisma` — boshqa enum'lar yonida (masalan, `XarajatKategoriya` yonida):

```prisma
enum Valyuta {
  UZS
  USD
}
```

- [ ] **Step 2: `Xarid` modeliga `valyuta` field qo'shish**

`prisma/schema.prisma` — `model Xarid` ichida, `izoh` maydonidan keyin:

```prisma
model Xarid {
  id              String        @id @default(cuid())
  taminotchiId    String
  jamiSumma       Decimal       @db.Decimal(12, 2)
  tolangan        Decimal       @default(0) @db.Decimal(12, 2)
  qoldiqQarz      Decimal       @db.Decimal(12, 2)
  izoh            String?
  valyuta         Valyuta       @default(UZS)  // ← yangi
  sana            DateTime      @default(now())
  foydalanuvchiId String

  taminotchi      Taminotchi    @relation(fields: [taminotchiId], references: [id])
  foydalanuvchi   Foydalanuvchi @relation(fields: [foydalanuvchiId], references: [id])
  tarkiblar       XaridTarkibi[]
  tolovlar        XaridTolov[]
  qarzTarixi      XaridQarzTarixi[]

  @@index([taminotchiId, valyuta])  // ← yangi indeks
  @@map("xaridlar")
}
```

- [ ] **Step 3: Migration yaratish va ishga tushirish**

```bash
npx prisma migrate dev --name add_valyuta_to_xarid
```

Expected: yangi migration fayli yaratiladi, prisma client regenerated, mavjud yozuvlar `UZS` bo'ladi.

- [ ] **Step 4: Verify**

```bash
npx prisma studio
```

Xaridlar jadvalida `valyuta` ustuni bor, hammasi `UZS`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(xaridlar): valyuta (USD/UZS) field schema'ga qo'shildi"
```

---

## Phase 2: Format Utility

### Task 2: `formatPul()` utility yozish (TDD)

**Files:**
- Create: `test/unit/format-pul.test.ts`
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Failing test yozish**

`test/unit/format-pul.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatPul } from '@/lib/utils'

describe('formatPul', () => {
  it("UZS uchun 'so'm' suffix qo'shadi", () => {
    expect(formatPul(150000, 'UZS')).toBe("150,000 so'm")
  })

  it('USD uchun $ prefix qo\'shadi', () => {
    expect(formatPul(150, 'USD')).toBe('$150')
  })

  it('USD da decimal saqlaydi', () => {
    expect(formatPul(150.5, 'USD')).toBe('$150.5')
    expect(formatPul(150.55, 'USD')).toBe('$150.55')
  })

  it("default UZS bo'ladi", () => {
    expect(formatPul(1000)).toBe("1,000 so'm")
  })

  it('string input qabul qiladi', () => {
    expect(formatPul('150000', 'UZS')).toBe("150,000 so'm")
    expect(formatPul('150', 'USD')).toBe('$150')
  })

  it('0 ni to\'g\'ri formatlaydi', () => {
    expect(formatPul(0, 'UZS')).toBe("0 so'm")
    expect(formatPul(0, 'USD')).toBe('$0')
  })
})
```

- [ ] **Step 2: Test fail bo'lishini verify**

```bash
npm run test:run -- format-pul
```

Expected: FAIL — `formatPul is not a function`

- [ ] **Step 3: `formatPul` ni `src/lib/utils.ts` ga qo'shish**

Mavjud `formatSum` dan keyin:

```ts
export function formatPul(summa: number | string, valyuta: 'UZS' | 'USD' = 'UZS'): string {
  const num = typeof summa === 'string' ? parseFloat(summa) || 0 : summa
  if (valyuta === 'USD') {
    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    return `$${formatted}`
  }
  return `${formatSum(num)} so'm`
}
```

- [ ] **Step 4: Test pass bo'lishini verify**

```bash
npm run test:run -- format-pul
```

Expected: PASS — barcha 6 test yashil.

- [ ] **Step 5: Lint va typecheck**

```bash
npm run lint && npx tsc --noEmit
```

Expected: xato yo'q.

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils.ts test/unit/format-pul.test.ts
git commit -m "feat(utils): formatPul() — USD/UZS valyuta uchun pul formatlash"
```

---

## Phase 3: MoneyInput Component

### Task 3: `MoneyInput` ga `valyuta` prop qo'shish

**Files:**
- Modify: `src/components/ui/money-input.tsx`

- [ ] **Step 1: `valyuta` prop qo'shish**

`src/components/ui/money-input.tsx` — `MoneyInputProps` interface:

```ts
interface MoneyInputProps {
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  min?: number
  max?: number
  required?: boolean
  disabled?: boolean
  className?: string
  suffix?: string
  valyuta?: 'UZS' | 'USD'  // ← yangi
}
```

- [ ] **Step 2: Komponent ichida valyuta'ga moslab suffix/prefix ko'rsatish**

`MoneyInput` funksiyasi parametrlari va body'sida:

```tsx
export default function MoneyInput({
  value, onChange,
  placeholder = "0",
  min,
  max,
  required = false,
  disabled = false,
  className,
  suffix,
  valyuta,
}: MoneyInputProps) {
  // ...mavjud kod...

  // valyuta priority: agar valyuta berilgan bo'lsa, suffix/prefix avtomatik
  const isUsd = valyuta === 'USD'
  const computedSuffix = suffix !== undefined ? suffix : (valyuta ? (isUsd ? '' : "so'm") : "so'm")
  const showPrefix = isUsd

  // formatWithCommas — USD uchun decimal qabul qilsin
  // ...
}
```

USD uchun decimal qabul qilish kerak. `handleChange` ni o'zgartirish:

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const inputValue = e.target.value
  let raw: string
  if (isUsd) {
    // USD: decimal qabul qilamiz, lekin faqat 1 ta nuqta va 2 ta knopka
    raw = inputValue.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    // 2 ta decimal cheklash
    const parts = raw.split('.')
    if (parts[1] && parts[1].length > 2) {
      raw = `${parts[0]}.${parts[1].slice(0, 2)}`
    }
  } else {
    raw = inputValue.replace(/\D/g, '')
  }
  if (max !== undefined && raw && Number(raw) > max) {
    onChange(String(max))
    return
  }
  onChange(raw)
}
```

`formatWithCommas` ni ham USD'ga moslash:

```tsx
function formatWithCommas(val: string, isUsd: boolean): string {
  if (!val) return ''
  if (isUsd) {
    const [int, dec] = val.split('.')
    const formatted = Number(int || 0).toLocaleString('en-US')
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }
  const num = val.replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('en-US')
}
```

`displayValue` chaqiruvi:

```tsx
const displayValue = value ? formatWithCommas(String(value), isUsd) : ''
```

JSX'da prefix:

```tsx
<div className={...}>
  {showPrefix && displayValue && (
    <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 whitespace-nowrap">$</span>
  )}
  <input ... />
  {computedSuffix && displayValue && (
    <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 whitespace-nowrap">{computedSuffix}</span>
  )}
</div>
```

- [ ] **Step 3: Manual sanity check**

Brauzerda Xaridlar sahifasini ochib, mavjud `MoneyInput` (so'm uchun) hali ham ishlashini tekshirish — backwards compatible.

- [ ] **Step 4: Lint va typecheck**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/money-input.tsx
git commit -m "feat(ui): MoneyInput valyuta prop (USD/UZS) qo'shildi"
```

---

## Phase 4: API — Xaridlar valyuta bilan

### Task 4: `POST /api/xaridlar` — valyuta qabul qilish

**Files:**
- Modify: `src/app/api/xaridlar/route.ts`

- [ ] **Step 1: POST handler'da valyuta qabul qilish**

`src/app/api/xaridlar/route.ts` — `POST` funksiyasi ichida `data` deconstructionga `valyuta` qo'shish:

```ts
const { taminotchiId, tarkiblar, tolangan, izoh, rejim, qarzSumma, valyuta } = data

// Valyuta validatsiya
const tasdiqlanganValyuta: 'UZS' | 'USD' = valyuta === 'USD' ? 'USD' : 'UZS'
```

- [ ] **Step 2: Qarz rejimida valyuta'ni saqlash**

`if (rejim === 'qarz')` ichida `prisma.xarid.create` ga qo'shish:

```ts
const yangi = await tx.xarid.create({
  data: {
    taminotchiId,
    jamiSumma: qarz,
    tolangan: 0,
    qoldiqQarz: qarz,
    izoh: izoh || 'Qarz',
    valyuta: tasdiqlanganValyuta,  // ← yangi
    foydalanuvchiId,
  },
  // ...
})
```

- [ ] **Step 3: Oddiy xarid'da ham valyuta'ni saqlash**

`prisma.xarid.create` chaqiruvida:

```ts
const xarid = await prisma.xarid.create({
  data: {
    taminotchiId: taminotchiId || null,
    jamiSumma,
    tolangan: tolanganSumma,
    qoldiqQarz,
    izoh: izoh || null,
    valyuta: tasdiqlanganValyuta,  // ← yangi
    foydalanuvchiId,
    tarkiblar: { /* ... */ },
  },
  // ...
})
```

- [ ] **Step 4: Lint va typecheck**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 5: Manual API test (dev server)**

Brauzer DevTools yoki Postman bilan:

```bash
curl -X POST http://localhost:3000/api/xaridlar \
  -H "Content-Type: application/json" \
  -d '{"valyuta":"USD","taminotchiId":"...","tarkiblar":[{"tovarNomi":"Test","miqdor":1,"birlikNarxi":50}],"tolangan":"30","izoh":"USD test"}'
```

Expected: 201, `valyuta: "USD"` qaytadi. Database'da ham USD yozilgan.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/xaridlar/route.ts
git commit -m "feat(api/xaridlar): POST valyuta (USD/UZS) qabul qiladi"
```

---

### Task 5: `GET /api/xaridlar` — valyuta filtri

**Files:**
- Modify: `src/app/api/xaridlar/route.ts`

- [ ] **Step 1: Query param'dan valyuta o'qish**

`GET` handler ichida:

```ts
const { searchParams } = new URL(req.url)
const taminotchiId = searchParams.get('taminotchiId') || ''
const dan = searchParams.get('dan') || ''
const gacha = searchParams.get('gacha') || ''
const valyuta = searchParams.get('valyuta') || ''  // ← yangi

const where: any = {}
if (taminotchiId) where.taminotchiId = taminotchiId
if (valyuta === 'UZS' || valyuta === 'USD') where.valyuta = valyuta  // ← yangi
if (dan || gacha) { /* mavjud */ }
```

- [ ] **Step 2: Lint va typecheck**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Manual test**

```bash
curl 'http://localhost:3000/api/xaridlar?valyuta=USD'
```

Expected: faqat USD xaridlar.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/xaridlar/route.ts
git commit -m "feat(api/xaridlar): GET valyuta filtri (?valyuta=USD|UZS)"
```

---

### Task 6: `GET /api/xaridlar/summary` — yangi endpoint

**Files:**
- Create: `src/app/api/xaridlar/summary/route.ts`

- [ ] **Step 1: Endpoint yaratish**

`src/app/api/xaridlar/summary/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const [uzs, usd] = await Promise.all([
      prisma.xarid.aggregate({
        where: { valyuta: 'UZS', qoldiqQarz: { gt: 0 } },
        _sum: { qoldiqQarz: true },
      }),
      prisma.xarid.aggregate({
        where: { valyuta: 'USD', qoldiqQarz: { gt: 0 } },
        _sum: { qoldiqQarz: true },
      }),
    ])

    return NextResponse.json({
      uzsQarz: Number(uzs._sum.qoldiqQarz || 0),
      usdQarz: Number(usd._sum.qoldiqQarz || 0),
    })
  } catch (e) {
    console.error('[Xaridlar summary GET]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Lint va typecheck**

```bash
npm run lint && npx tsc --noEmit
```

- [ ] **Step 3: Manual test**

```bash
curl 'http://localhost:3000/api/xaridlar/summary'
```

Expected: `{"uzsQarz": <number>, "usdQarz": <number>}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/xaridlar/summary/
git commit -m "feat(api/xaridlar): summary endpoint (per-currency qarz total)"
```

---

## Phase 5: Frontend — Xaridlar sahifasi

### Task 7: `Xarid` interface'ga `valyuta` qo'shish

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Type'ni yangilash**

Sahifa boshida:

```ts
interface Xarid {
  id: string
  sana: string
  jamiSumma: number
  tolangan: number
  qoldiqQarz: number
  izoh: string | null
  valyuta: 'UZS' | 'USD'  // ← yangi
  taminotchi: { id: string; nomi: string; manzil?: string | null; kontaktShaxs?: string | null } | null
  tarkiblar: XaridTarkibi[]
  tolovlar: XaridTolov[]
  qarzTarixi: XaridQarzTarixi[]
  foydalanuvchi: { ism: string }
}
```

- [ ] **Step 2: `formatPul` import**

```tsx
import { formatSum, formatSana, formatPul } from '@/lib/utils'
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Hozircha xato bo'lishi mumkin (boshqa joylarda `valyuta` ishlatilmagan) — keyingi qadamda tuzatamiz.

- [ ] **Step 4: Commit (vaqtinchalik, keyingi task'da to'liq ishlatadi)**

Hozircha commit qilmaymiz — keyingi task bilan birga.

---

### Task 8: Form state'larga valyuta qo'shish

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Yangi xarid form'iga valyuta qo'shish**

```tsx
const [form, setForm] = useState({
  taminotchiId: '',
  tolangan: '',
  izoh: '',
  valyuta: 'UZS' as 'UZS' | 'USD',  // ← yangi
})
```

- [ ] **Step 2: Yangi qarz form'iga valyuta qo'shish**

```tsx
const [yangiQarzForm, setYangiQarzForm] = useState({
  taminotchiId: '',
  summa: '',
  izoh: '',
  valyuta: 'UZS' as 'UZS' | 'USD',  // ← yangi
})
```

- [ ] **Step 3: Filter state qo'shish**

```tsx
const [valyutaFilter, setValyutaFilter] = useState<'' | 'UZS' | 'USD'>('')
```

- [ ] **Step 4: Summary state qo'shish**

```tsx
const [summary, setSummary] = useState<{ uzsQarz: number; usdQarz: number }>({ uzsQarz: 0, usdQarz: 0 })
```

- [ ] **Step 5: Form reset'larida valyuta'ni saqlash**

`xaridSaqlash` muvaffaqiyatdan keyin:

```tsx
setForm({ taminotchiId: '', tolangan: '', izoh: '', valyuta: 'UZS' })
```

`yangiQarzSaqlash` ichida:

```tsx
setYangiQarzForm({ taminotchiId: '', summa: '', izoh: '', valyuta: 'UZS' })
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: xato yo'q.

---

### Task 9: Filter va yuklash (load) logikasini yangilash

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: `yuklash` funksiyasiga valyuta qo'shish**

```tsx
async function yuklash() {
  setYuklanmoqda(true)
  const params = new URLSearchParams()
  if (taminotchiFilter) params.set('taminotchiId', taminotchiFilter)
  if (valyutaFilter) params.set('valyuta', valyutaFilter)  // ← yangi
  if (danFilter) params.set('dan', danFilter)
  if (gachaFilter) params.set('gacha', gachaFilter)
  const data = await fetch(`/api/xaridlar?${params}`).then(r => r.json())
  setXaridlar(data || [])
  setYuklanmoqda(false)
}

useEffect(() => { yuklash() }, [taminotchiFilter, valyutaFilter, danFilter, gachaFilter])
```

- [ ] **Step 2: Summary yuklash funksiyasi**

```tsx
async function yuklaSummary() {
  try {
    const data = await fetch('/api/xaridlar/summary').then(r => r.json())
    setSummary({ uzsQarz: Number(data.uzsQarz || 0), usdQarz: Number(data.usdQarz || 0) })
  } catch {
    // ignore
  }
}

// useEffect — filterlardan keyin summary'ni ham yangilash
useEffect(() => { yuklaSummary() }, [xaridlar])
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

---

### Task 10: Summary kartalar UI'da ko'rsatish

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Toolbardan oldin summary kartalar**

`return ( <div className="space-y-4">` ichida, eng birinchi:

```tsx
{/* Summary kartalar */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-1">
      <Banknote size={16} className="text-blue-600" />
      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">So&apos;mda jami qarz</p>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {formatPul(summary.uzsQarz, 'UZS')}
    </p>
  </div>
  <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-1">
      <Banknote size={16} className="text-green-600" />
      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">Dollarda jami qarz</p>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {formatPul(summary.usdQarz, 'USD')}
    </p>
  </div>
</div>
```

- [ ] **Step 2: Typecheck va lint**

```bash
npx tsc --noEmit && npm run lint
```

---

### Task 11: Toolbar'ga valyuta filter qo'shish

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Filter select element**

Toolbarda, ta'minotchi filter'idan keyin:

```tsx
<select
  value={valyutaFilter}
  onChange={e => setValyutaFilter(e.target.value as '' | 'UZS' | 'USD')}
  className="px-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
>
  <option value="">Hammasi (valyuta)</option>
  <option value="UZS">So&apos;m</option>
  <option value="USD">Dollar</option>
</select>
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

---

### Task 12: Jadval va Card view'da `formatPul` ishlatish + valyuta badge

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Jadvaldagi `formatSum` chaqiruvlarini `formatPul` bilan almashtirish**

Jadval ichida (table view):

```tsx
// Jami summa
<td className="...">{formatPul(x.jamiSumma, x.valyuta)}</td>

// To'langan
<td className="...">{formatPul(x.tolangan, x.valyuta)}</td>

// Qoldiq qarz
<td className="...">
  {x.qoldiqQarz > 0 ? formatPul(x.qoldiqQarz, x.valyuta) : '—'}
</td>
```

- [ ] **Step 2: Ta'minotchi yonida valyuta badge**

Jadvalda taminotchi qatorida:

```tsx
<td className="px-4 py-3 text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
  {x.taminotchi ? (
    <div>
      <div className="font-medium flex items-center gap-1.5">
        {x.taminotchi.nomi}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${x.valyuta === 'USD' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'}`}>
          {x.valyuta}
        </span>
      </div>
      {x.taminotchi.kontaktShaxs && (
        <div className="text-gray-400 dark:text-gray-600 text-xs">{x.taminotchi.kontaktShaxs}</div>
      )}
    </div>
  ) : (
    <span className="text-gray-400 dark:text-gray-600 italic">Noma&apos;lum</span>
  )}
</td>
```

- [ ] **Step 3: Expanded row (tarkiblar) — `formatPul` ishlatish**

```tsx
{x.tarkiblar.map(t => (
  <div key={t.id} className="flex items-center justify-between text-sm gap-4">
    <span className="text-gray-800 dark:text-gray-200 font-medium">{t.tovarNomi}</span>
    <span className="text-gray-500 dark:text-gray-500 text-xs">{t.miqdor} dona × {formatPul(t.birlikNarxi, x.valyuta)}</span>
    <span className="text-gray-900 dark:text-gray-100 font-semibold">{formatPul(t.jami, x.valyuta)}</span>
  </div>
))}
```

Qarz tarixi va to'lovlar:

```tsx
<span className="text-red-600 font-semibold">+{formatPul(q.summa, x.valyuta)}</span>
// ...
<span className="text-green-600 font-semibold">{formatPul(t.summa, x.valyuta)}</span>
```

- [ ] **Step 4: Card view'da ham `formatPul` ishlatish**

Cardda:

```tsx
<p className="text-gray-900 dark:text-gray-100 font-bold text-sm">{formatPul(x.jamiSumma, x.valyuta)}</p>
<p className="text-green-600 font-medium text-sm">{formatPul(x.tolangan, x.valyuta)}</p>
<p className={...}>
  {x.qoldiqQarz > 0 ? formatPul(x.qoldiqQarz, x.valyuta) : '—'}
</p>
// ...
{x.tarkiblar.slice(0, 3).map(t => (
  <div key={t.id} className="flex items-center justify-between text-xs">
    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{t.tovarNomi}</span>
    <span className="text-gray-400 dark:text-gray-600 shrink-0 ml-2">{t.miqdor} × {formatPul(t.birlikNarxi, x.valyuta)}</span>
  </div>
))}
```

Card view'dagi ta'minotchi nomi yonida ham valyuta badge qo'shish (Step 2 dagi kabi).

- [ ] **Step 5: Typecheck va lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 6: Commit (Task 7-12 birgalikda)**

```bash
git add src/app/\(dashboard\)/xaridlar/page.tsx
git commit -m "feat(xaridlar): valyuta filter, summary kartalar, formatPul, badge"
```

---

### Task 13: Yangi xarid modali — valyuta toggle

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Modalda valyuta toggle qo'shish**

Yangi xarid modali ichida (ta'minotchi tanlashdan oldin):

```tsx
<div>
  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Valyuta</label>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setForm(f => ({ ...f, valyuta: 'UZS' }))}
      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${form.valyuta === 'UZS' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
    >
      So&apos;m (UZS)
    </button>
    <button
      type="button"
      onClick={() => setForm(f => ({ ...f, valyuta: 'USD' }))}
      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${form.valyuta === 'USD' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
    >
      Dollar (USD)
    </button>
  </div>
</div>
```

- [ ] **Step 2: Tarkib narx inputlari valyuta'ga moslab**

Tarkib map'ida:

```tsx
<div className="w-32">
  <MoneyInput
    value={t.birlikNarxi}
    onChange={v => tarkibOzgartirish(idx, 'birlikNarxi', v)}
    placeholder="Narx"
    required={idx === 0}
    valyuta={form.valyuta}  // ← yangi
  />
</div>
```

- [ ] **Step 3: Jami hisob `formatPul` ishlatish**

```tsx
{jamiHisob > 0 && (
  <p className="text-right text-sm text-gray-600 dark:text-gray-400 mt-2">
    Jami: <span className="font-bold text-gray-900 dark:text-gray-100">{formatPul(jamiHisob, form.valyuta)}</span>
  </p>
)}
```

- [ ] **Step 4: To'langan input ham valyuta'da**

```tsx
<MoneyInput
  value={form.tolangan}
  onChange={v => setForm(f => ({ ...f, tolangan: v }))}
  placeholder="0"
  valyuta={form.valyuta}  // ← yangi
/>
{jamiHisob > 0 && parseFloat(form.tolangan || '0') < jamiHisob && (
  <p className="text-xs text-amber-600 mt-1">
    Qoldiq qarz: {formatPul(jamiHisob - parseFloat(form.tolangan || '0'), form.valyuta)}
  </p>
)}
```

- [ ] **Step 5: Submit'da valyuta yuborish**

`xaridSaqlash` ichida `body`:

```tsx
body: JSON.stringify({
  taminotchiId: form.taminotchiId || null,
  tolangan: form.tolangan,
  izoh: form.izoh,
  valyuta: form.valyuta,  // ← yangi
  tarkiblar: validTarkiblar.map(t => ({
    tovarNomi: t.tovarNomi,
    miqdor: parseFloat(t.miqdor),
    birlikNarxi: parseFloat(t.birlikNarxi),
  })),
}),
```

- [ ] **Step 6: Typecheck va lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(dashboard\)/xaridlar/page.tsx
git commit -m "feat(xaridlar): yangi xarid modal — valyuta toggle (USD/UZS)"
```

---

### Task 14: Yangi qarz modali — valyuta toggle

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: Yangi qarz modaliga toggle qo'shish**

`yangiQarzModal` ichida (Ta'minotchi tanlashdan oldin):

```tsx
<div>
  <label className="text-gray-700 dark:text-gray-300 text-sm mb-1 block font-medium">Valyuta</label>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setYangiQarzForm(f => ({ ...f, valyuta: 'UZS' }))}
      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${yangiQarzForm.valyuta === 'UZS' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
    >
      So&apos;m (UZS)
    </button>
    <button
      type="button"
      onClick={() => setYangiQarzForm(f => ({ ...f, valyuta: 'USD' }))}
      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${yangiQarzForm.valyuta === 'USD' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
    >
      Dollar (USD)
    </button>
  </div>
</div>
```

- [ ] **Step 2: Qarz summa input valyuta'da**

```tsx
<MoneyInput
  value={yangiQarzForm.summa}
  onChange={v => setYangiQarzForm(f => ({ ...f, summa: v }))}
  required
  min={1}
  placeholder="0"
  valyuta={yangiQarzForm.valyuta}  // ← yangi
/>
```

- [ ] **Step 3: Submit'da valyuta yuborish**

`yangiQarzSaqlash` ichida `body`:

```tsx
body: JSON.stringify({
  taminotchiId: yangiQarzForm.taminotchiId,
  rejim: 'qarz',
  qarzSumma: summa,
  valyuta: yangiQarzForm.valyuta,  // ← yangi
  izoh: yangiQarzForm.izoh || null,
}),
```

- [ ] **Step 4: Typecheck va lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/xaridlar/page.tsx
git commit -m "feat(xaridlar): yangi qarz modal — valyuta toggle (USD/UZS)"
```

---

### Task 15: To'lov va mavjud xaridga qarz qo'shish modallari — valyuta meros olish

**Files:**
- Modify: `src/app/(dashboard)/xaridlar/page.tsx`

- [ ] **Step 1: To'lov modali — xarid valyutasini ko'rsatish**

`tolovModal` ichida ta'minotchi info yaqinida:

```tsx
<div className="text-sm text-gray-500 dark:text-gray-400">
  <p>Ta&apos;minotchi: <span className="font-medium text-gray-900 dark:text-gray-100">{tolovModal.taminotchi?.nomi || "Noma'lum"}</span></p>
  <p>Valyuta: <span className={`font-semibold ${tolovModal.valyuta === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>{tolovModal.valyuta}</span></p>
  <p>Qoldiq qarz: <span className="font-bold text-red-600">{formatPul(tolovModal.qoldiqQarz, tolovModal.valyuta)}</span></p>
</div>
```

- [ ] **Step 2: To'lov MoneyInput'ga valyuta**

```tsx
<MoneyInput
  value={tolovForm.summa}
  onChange={v => setTolovForm(f => ({ ...f, summa: v }))}
  placeholder="0"
  required
  valyuta={tolovModal.valyuta}  // ← yangi
/>
```

- [ ] **Step 3: Mavjud xaridga qarz qo'shish modali — valyuta'ni xariddan olish**

`qarzModal` ichida valyuta info ko'rsatish va MoneyInput'ga qo'shish:

```tsx
<div className="flex gap-3 mt-1 text-xs flex-wrap">
  <span className={`font-semibold ${qarzModal.valyuta === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>{qarzModal.valyuta}</span>
  <span className="text-gray-400">Jami: {formatPul(qarzModal.jamiSumma, qarzModal.valyuta)}</span>
  <span className="text-green-600">To&apos;langan: {formatPul(qarzModal.tolangan, qarzModal.valyuta)}</span>
  <span className="text-red-600 font-semibold">Qoldiq: {formatPul(qarzModal.qoldiqQarz, qarzModal.valyuta)}</span>
</div>
```

```tsx
<MoneyInput
  value={qarzForm.summa}
  onChange={v => setQarzForm(f => ({ ...f, summa: v }))}
  required
  min={1}
  placeholder="0"
  valyuta={qarzModal.valyuta}  // ← yangi
/>
```

Va qarz tarixi'da `formatPul` ishlatish:

```tsx
<p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{formatPul(q.summa, qarzModal.valyuta)}</p>
// ...
<span className="text-red-600 text-xs font-medium shrink-0 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-lg">
  +{formatPul(q.summa, qarzModal.valyuta)}
</span>
```

- [ ] **Step 4: Typecheck va lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/xaridlar/page.tsx
git commit -m "feat(xaridlar): to'lov va qarz modal — xarid valyutasini meros oladi"
```

---

## Phase 6: Verification

### Task 16: Build va to'liq quality gate

**Files:** —

- [ ] **Step 1: To'liq typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 ta xato.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 ta error, 0 ta warning.

- [ ] **Step 3: Barcha testlar**

```bash
npm run test:run
```

Expected: barcha testlar yashil.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: muvaffaqiyatli build, 0 ta xato.

- [ ] **Step 5: Dev server va manual e2e**

```bash
npm run dev
```

Tekshirish ro'yxati:
1. `/xaridlar` ochiladi, summary kartalar ko'rinadi
2. "Yangi xarid" bosish — modal ochiladi, valyuta toggle ishlaydi
3. UZS tanlab, tovar narxlari `so'm` bilan ko'rinadi
4. USD tanlab, narxlar `$` bilan ko'rinadi (decimal qabul qilinadi)
5. USD xarid saqlanadi — jadvalda `[USD]` badge ko'rinadi, summary'da "Dollar qarz" ortadi
6. Valyuta filter — `Dollar` tanlab, faqat USD xaridlar ko'rinadi
7. To'lov modali — xarid valyutasi ko'rsatiladi, MoneyInput shu valyutada
8. Qarz qo'shish (mavjud xarid) — xarid valyutasida ishlaydi
9. "Qarz qo'shish" tugmasi (toolbar) — yangi qarz modal valyuta toggle bilan ochiladi

- [ ] **Step 6: Final commit (agar build/test'da kichik tuzatish kerak bo'lsa)**

Agar quality gatedan o'tmasa — tuzatish va commit. O'tsa — tugadi.

---

## Self-Review

### Spec coverage
- ✅ `Valyuta` enum + `Xarid.valyuta` field — Task 1
- ✅ `formatPul` utility — Task 2
- ✅ MoneyInput valyuta prop — Task 3
- ✅ POST `/api/xaridlar` valyuta — Task 4
- ✅ GET `/api/xaridlar?valyuta=` filter — Task 5
- ✅ GET `/api/xaridlar/summary` — Task 6
- ✅ Frontend type — Task 7
- ✅ Form state'lar — Task 8
- ✅ Filter va load — Task 9
- ✅ Summary kartalar UI — Task 10
- ✅ Toolbar valyuta filter — Task 11
- ✅ Jadval/card formatPul + badge — Task 12
- ✅ Yangi xarid valyuta toggle — Task 13
- ✅ Yangi qarz valyuta toggle — Task 14
- ✅ To'lov/qarz modal — valyuta meros — Task 15
- ✅ Build + e2e — Task 16

### Placeholder check — clean (no TBD/TODO)

### Type consistency
- `'UZS' | 'USD'` literal type — barcha task'larda bir xil
- `formatPul(summa, valyuta)` — argumentlar tartibi bir xil
- `valyuta` prop — barcha komponentlarda bir xil nom
