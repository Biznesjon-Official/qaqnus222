# Hisobotlar — Senior ERP darajasiga refactor + 5 ta yangi kritik hisobot

**Sana:** 2026-04-18
**Muallif:** Biznesjon + Claude
**Maqsad:** Mavjud `/hisobotlar` sahifasini professional ERP (SAP/Odoo/1C standartida) darajasiga ko'tarish — arxitektura refactor + yangi kritik hisobotlar.

---

## 1. Maqsad va kontekst

### Hozirgi holat
- `/hisobotlar/page.tsx` — **738 qatorlik monolit** (barcha tab'lar va logikasi bir faylda)
- 7 tab: Umumiy, Sotuv, Tovarlar, Mijozlar, Nasiya, Ombor, Kassirlar
- `/api/hisobotlar/` — flat struktura, filter mantiqi takror yoziladi har endpoint'da
- Asosiy endpoint juda katta javob qaytaradi (barcha tab uchun yetarli ma'lumot)

### Senior ERP'larda bor, bizda yo'q
1. **P&L Statement** — Daromad/COGS/OpEx/Net profit bilan to'liq moliyaviy hisobot
2. **Kategoriya sotuv tahlili** — qaysi kategoriya foyda beradi, qaysi qattiq
3. **Qaytarish (Returns) tahlili** — % va sabablar breakdown
4. **Payables aging** — ta'minotchilarga qarz muddati (xuddi Nasiya aging kabi)
5. **Stock turnover** — har tovarning aylanish tezligi (kun)

### Foydalanuvchi hikoyalari

**FH-1 (Do'kon egasi):** Oy oxirida P&L hisobotini ko'rib, sof foyda marjinini baholash. Haqiqiy daromaddan COGS va operatsion xarajatlarni ayrib, sof foyda ko'rish.

**FH-2 (Menejer):** Qaysi kategoriya (ichimlik, oziq-ovqat, maishiy) eng ko'p foyda keltiradi — asosan shunga e'tibor qaratish.

**FH-3 (Kassir/Menejer):** Mijoz tovarni qaytargan — bu yilda nechta qaytarish bo'lgan, sababi nima, qaysi tovarlar ko'proq qaytariladi.

**FH-4 (Buxgalter):** Ta'minotchilarga qarz — kim eng ko'p kechikkan, qaysi summani to'lash kerak birinchi.

**FH-5 (Omborchi):** Qaysi tovarlar tez sotiladi (yaxshi turnover), qaysilari ombor'da uzoq yotadi (dead stock risk).

---

## 2. Arxitektura

### 2.1 Komponent struktura

```
src/app/(dashboard)/hisobotlar/
├── page.tsx                         (layout: header + tab nav + filter + active tab)
├── layout.tsx                       (auth check, session context)
├── _hooks/
│   ├── useReportFilters.ts          (URL-driven sana + preset + tur)
│   └── useReportData.ts             (generic fetch wrapper, cache, loading)
├── _components/
│   ├── ReportFilter.tsx             (sana + preset tugmalari, shared)
│   ├── KPICard.tsx                  (umumiy KPI karta komponenti)
│   ├── ReportSection.tsx            (card wrapper with header + actions)
│   ├── ExportButton.tsx             (Excel + PDF har tab uchun)
│   ├── SkeletonKPI.tsx
│   ├── SkeletonChart.tsx
│   ├── SkeletonTable.tsx
│   ├── TrendBadge.tsx               (▲+X% / ▼-X% badge)
│   ├── DrillDownModal.tsx           (reusable drill-down modal)
│   └── ComparisonDonut.tsx          (reusable donut with comparison)
└── _tabs/
    ├── UmumiyTab.tsx                (hozirgi Umumiy)
    ├── MoliyaTab.tsx                🆕 NEW
    ├── SotuvTab.tsx                 (hozirgi + kategoriya + chegirma + tolov trend)
    ├── TovarlarTab.tsx              (ABC + dead stock + turnover)
    ├── OmborTab.tsx                 (hozirgi + valuation trend)
    ├── MijozlarTab.tsx              (hozirgi)
    ├── NasiyaTab.tsx                (hozirgi + drill-down)
    ├── XaridlarTab.tsx              🆕 NEW (Payables aging)
    └── KassirlarTab.tsx             (hozirgi)
```

### 2.2 API struktura

```
src/app/api/hisobotlar/
├── route.ts                         (main — KPI summary only)
├── umumiy/route.ts                  (grafikData, topTovarlar, tolovUsullari)
├── moliya/
│   ├── p-and-l/route.ts             🆕 NEW
│   └── cash-flow/route.ts           🆕 NEW (bonus)
├── sotuv/
│   ├── kategoriya/route.ts          🆕 NEW
│   ├── peak-hours/route.ts          (mavjud /soatlar ni ko'chirish)
│   ├── chegirma/route.ts            🆕 NEW
│   ├── tolov-trend/route.ts         🆕 NEW
│   └── returns/route.ts             🆕 NEW
├── tovarlar/
│   ├── abc/route.ts                 (mavjud)
│   ├── dead-stock/route.ts          (mavjud)
│   └── turnover/route.ts            🆕 NEW
├── ombor/
│   ├── current/route.ts             (hozirgi /ombor)
│   └── valuation-trend/route.ts     🆕 NEW
├── mijozlar/route.ts                (mavjud)
├── nasiya/
│   ├── aging/route.ts               (mavjud /nasiya-aging)
│   └── drill-down/route.ts          🆕 NEW (bucket bo'yicha)
├── xaridlar/
│   └── payables-aging/route.ts      🆕 NEW
└── kassirlar/route.ts               (mavjud)
```

### 2.3 Umumiy ma'lumot oqimi

```
[URL] /hisobotlar?tur=oylik&dan=...&gacha=...&tab=moliya
          │
          ▼
[useReportFilters hook] — filtrlardan + URL state
          │
          ▼
[Active Tab Component] — dynamically import
          │
          ▼
[useReportData hook] — fetch /api/hisobotlar/<kategoriya>/<endpoint>
          │
          ▼
[Render: KPICard + Chart + Table]
```

### 2.4 Shared helpers

`src/lib/hisobotlar.ts` (yangi):
```typescript
// Sana oraliqini aniqlash (tur + dan/gacha)
export function getReportDateRange(
  tur: 'kunlik' | 'haftalik' | 'oylik' | 'yillik',
  dan?: string,
  gacha?: string
): { dan: Date; gacha: Date; oldingi: { dan: Date; gacha: Date } }

// Umumiy sotuv filtri
export function baseSotuvFilter(danSana: Date, gachaSana: Date, kassirId?: string): Prisma.SotuvWhereInput

// Foiz o'zgarish hisobi
export function foizOzgarish(joriy: number, oldingi: number): number | null

// Aging bucket classification
export function agingBucket(muddat: Date, bugun: Date): 'kechikmagan' | 'b_0_30' | 'b_31_60' | 'b_61_90' | 'b_90_plus'
```

---

## 3. Yangi Tab'lar — batafsil

### 3.1 🆕 MOLIYA TAB (YANGI)

**Endpoint:** `/api/hisobotlar/moliya/p-and-l`

**Query params:** `tur`, `dan`, `gacha`

**Response:**
```typescript
{
  // Joriy davr
  revenue: number,                // Sotuv yakuniy summa (minus returns)
  cogs: number,                   // Cost of goods sold
  grossProfit: number,            // Revenue - COGS
  opex: {
    IJARA: number,
    MAOSH: number,
    TRANSPORT: number,
    KOMMUNAL: number,
    BOSHQA: number,
    total: number
  },
  netProfit: number,              // grossProfit - opex.total
  margin: {
    gross: number,                // (grossProfit / revenue) * 100
    net: number                   // (netProfit / revenue) * 100
  },

  // Oldingi davr taqqoslash
  oldingi: {
    revenue: number,
    grossProfit: number,
    netProfit: number,
  },

  // Foizlar
  foiz: {
    revenue: number | null,
    grossProfit: number | null,
    netProfit: number | null,
  },

  // Breakdown trend (kunlik/haftalik nuqtalar)
  trend: Array<{
    sana: string,
    revenue: number,
    cogs: number,
    netProfit: number,
  }>
}
```

**UI (MoliyaTab.tsx):**
```
┌─────────────────────────────────────────────────────────────┐
│ MOLIYAVIY KO'RSATKICHLAR                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │ REVENUE   │  │ GROSS     │  │ NET       │  │ NET       ││
│  │ 45,000,000│  │ PROFIT    │  │ PROFIT    │  │ MARGIN    ││
│  │ ▲+7.1%    │  │ 18,000,000│  │ 12,500,000│  │ 27.8%     ││
│  │           │  │ ▲+7.1%    │  │ ▲+7.8%    │  │ ▲+0.2pp   ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                             │
│  P&L STATEMENT (table)                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Joriy      Oldingi    O'zgarish    │  │
│  │ Daromad         45,000,000  42,000,000  +7.1%       │  │
│  │ (-) COGS       -27,000,000 -25,200,000  +7.1%       │  │
│  │ ──────────────────────────────────────────          │  │
│  │ Gross Profit    18,000,000  16,800,000  +7.1%       │  │
│  │ (-) Ijara        -3,000,000  -3,000,000    0%       │  │
│  │ (-) Maosh        -2,000,000  -1,800,000  +11.1%     │  │
│  │ (-) Transport      -500,000    -400,000  +25.0%     │  │
│  │ ──────────────────────────────────────────          │  │
│  │ Net Profit      12,500,000  11,600,000  +7.8%       │  │
│  │                                                     │  │
│  │ Gross margin: 40.0%    Prev: 40.0%    +0.0pp        │  │
│  │ Net margin:   27.8%    Prev: 27.6%    +0.2pp        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  FOYDA TREND (Stacked area chart)                          │
│  (Revenue/COGS/NetProfit — sanalar bo'yicha)               │
└─────────────────────────────────────────────────────────────┘
```

**Biznes qoida:**
- Revenue = `sum(sotuv.yakuniySumma) - sum(qaytarish.jamiSumma)` (davrda)
- COGS = `sum((sotuvTarkibi.miqdor) * tovar.kelishNarxi)` — faqat yakunlangan sotuvlardan
- Gross margin = `(revenue - cogs) / revenue * 100`
- Net margin = `net profit / revenue * 100`
- SHERIK to'lov usulidagi sotuvlar revenue'ga kirmaydi (hozirgi qoida saqlanadi)

### 3.2 🆕 XARIDLAR TAB (YANGI — Payables Aging)

**Endpoint:** `/api/hisobotlar/xaridlar/payables-aging`

**Response:**
```typescript
{
  umumiy: {
    jamiXarid: number,
    jamiTolangan: number,
    jamiQarz: number,
    xaridSoni: number,
  },

  aging: {
    kechikmagan: { count: number, summa: number, xaridlar: XaridQisqa[] },
    b_0_30:      { count: number, summa: number, xaridlar: XaridQisqa[] },
    b_31_60:     { count: number, summa: number, xaridlar: XaridQisqa[] },
    b_61_90:     { count: number, summa: number, xaridlar: XaridQisqa[] },
    b_90_plus:   { count: number, summa: number, xaridlar: XaridQisqa[] },
  },

  topTaminotchilar: Array<{
    taminotchiId: string,
    nomi: string,
    kontaktShaxs: string | null,
    telefon: string | null,
    xaridSoni: number,
    jamiQarz: number,
    eskiQarzKunlar: number  // eng eski qarz qancha kun
  }>
}

interface XaridQisqa {
  id: string,
  sana: string,
  taminotchi: { id, nomi, kontaktShaxs },
  jamiSumma: number,
  tolangan: number,
  qoldiqQarz: number,
  kechikkanKun: number,
}
```

**UI (XaridlarTab.tsx):**
- Nasiya tab ga o'xshash — aging bucket'lar (5 ta rangli karta)
- Har bucket'ga bosilganda drill-down modal: qaysi xaridlar, qaysi ta'minotchidan, qancha
- Top 20 ta'minotchi jadvali (eng eski qarzlar birinchi)

### 3.3 🔧 SOTUV TAB (ENHANCED)

Mavjud: Peak soatlar heatmap, kunlik sotuv + chek grafik.

**Qo'shiladi:**

#### 3.3.1 Kategoriya bo'yicha sotuv

**Endpoint:** `/api/hisobotlar/sotuv/kategoriya`

**Response:**
```typescript
{
  categories: Array<{
    kategoriyaId: string,
    nomi: string,
    revenue: number,
    qty: number,                    // sotilgan miqdor
    margin: number,                 // foyda
    marginPercent: number,          // % margin
    productCount: number,           // necha xil tovar
    topProducts: Array<{ nomi, revenue }>,  // top 3
    trend: 'up' | 'down' | 'flat',
    changePercent: number | null,   // oldingi davrga
  }>
}
```

**UI:** Horizontal bar chart + jadval

#### 3.3.2 Chegirma ta'siri

**Endpoint:** `/api/hisobotlar/sotuv/chegirma`

**Response:**
```typescript
{
  umumiy: {
    jamiChegirma: number,
    chegirmaliSotuvSoni: number,
    jamiSotuvSoni: number,
    ulush: number,                  // % sotuvlar chegirma bilan
    ortachaChegirma: number,
  },
  trend: Array<{ sana, chegirma, sotuv }>,
  topChegirmaliTovarlar: Array<{ nomi, chegirma, miqdor }>,
}
```

#### 3.3.3 To'lov usuli trend

**Endpoint:** `/api/hisobotlar/sotuv/tolov-trend`

**Response:**
```typescript
{
  trend: Array<{
    sana: string,
    NAQD: number,
    KARTA: number,
    ARALASH: number,
    NASIYA: number,
    SHERIK: number,
  }>,
  ulush: {
    NAQD: number,           // % of total
    KARTA: number,
    ARALASH: number,
    NASIYA: number,
    SHERIK: number,
  }
}
```

**UI:** Stacked area chart + legend

#### 3.3.4 Qaytarishlar tahlili

**Endpoint:** `/api/hisobotlar/sotuv/returns`

**Response:**
```typescript
{
  umumiy: {
    jamiQaytarish: number,
    soni: number,
    returnRate: number,             // % of sotuv
    avgReturnValue: number,
  },
  bySabab: Array<{ sabab: string | null, count: number, summa: number }>,
  topReturnedProducts: Array<{ nomi, count, jami }>,
  trend: Array<{ sana, count, summa }>,
}
```

### 3.4 🔧 TOVARLAR TAB (ENHANCED)

Mavjud: ABC + Dead stock.

**Qo'shiladi:** Stock turnover

**Endpoint:** `/api/hisobotlar/tovarlar/turnover`

**Response:**
```typescript
{
  umumiy: {
    ortachaTurnoverKun: number,    // barcha tovarlar o'rta turnover
    engTezKun: number,
    engSekinKun: number,
  },
  tovarlar: Array<{
    tovarId: string,
    nomi: string,
    birlik: string,
    sotilganMiqdor: number,        // davrda
    hozirgiQoldiq: number,
    turnoverKun: number | null,    // qoldiq / (sotuv/kun)
    klass: 'tez' | 'orta' | 'sekin' | 'yotib-qolgan',
  }>
}
```

**Turnover hisoblash:**
- Agar davrda kunlik o'rtacha sotuv = N
- Hozirgi qoldiq = Q
- Turnover kun = Q / N (necha kunda tugaydi)
- Klass: <7 kun = tez, 7-30 kun = o'rta, 30-60 kun = sekin, >60 kun = yotib-qolgan

### 3.5 🔧 NASIYA TAB (ENHANCED)

Mavjud: Aging bucket'lar, top 20 qarzdor.

**Qo'shiladi:** Drill-down modal

**Endpoint:** `/api/hisobotlar/nasiya/drill-down`

**Query:** `bucket=b_0_30` (yoki boshqa)

**Response:**
```typescript
{
  bucket: string,
  nasiyalar: Array<{
    id: string,
    mijoz: { ism, telefon, manzil },
    sotuv: { chekRaqami, sana } | null,
    jamiQarz: number,
    tolangan: number,
    qoldiq: number,
    muddat: string | null,
    kechikkanKun: number,
  }>
}
```

**UI:** Aging bucket kartasiga bosilganda slide-out yoki modal — ichida batafsil jadval (telefon, sana, muddat)

### 3.6 🔧 OMBOR TAB (ENHANCED)

Mavjud: Jami qiymat, kategoriya taqsimoti, kam qolgan.

**Qo'shiladi:** Valuation trend (istalgan kun uchun ombor qiymati)

**Endpoint:** `/api/hisobotlar/ombor/valuation-trend`

**Response:**
```typescript
{
  trend: Array<{
    sana: string,                   // ISO date
    kelishQiymati: number,          // COGS qiymat
    sotishQiymati: number,          // retail qiymat
  }>
}
```

**Hisoblash:**
- Har kun uchun: `qoldiq(sana) = sum(KIRIM) - sum(CHIQIM) - sum(YOQOTISH) - sum(OTKAZMA_CHIQIM) + sum(OTKAZMA_KIRIM)` har tovar uchun
- Optimizatsiya: kunlik snapshot cache yoki on-the-fly hisoblash

---

## 4. Shared Filter tizimi

### 4.1 `useReportFilters` hook

```typescript
export function useReportFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const filtrlar = useMemo(() => ({
    tab: sp.get('tab') ?? 'umumiy',
    tur: (sp.get('tur') ?? 'oylik') as 'kunlik' | 'haftalik' | 'oylik' | 'yillik',
    dan: sp.get('dan') ?? '',
    gacha: sp.get('gacha') ?? '',
  }), [sp])

  const setTab = (tab: string) => { /* replace URL */ }
  const setTur = (tur: string) => { /* replace URL, reset dan/gacha */ }
  const setSana = (dan: string, gacha: string) => { /* replace URL, tur=maxsus */ }

  return { filtrlar, setTab, setTur, setSana }
}
```

### 4.2 `ReportFilter` component

Umumiy header component — sana preset (Bugun/Hafta/Oy/Yil) + custom dan/gacha. Barcha tab'lar shundan oladi.

### 4.3 `useReportData` hook

```typescript
export function useReportData<T>(
  endpoint: string,
  filtrlar: { tur: string, dan?: string, gacha?: string, [key: string]: any }
): { data: T | null, yuklanmoqda: boolean, xato: string | null, qaytaYuklash: () => void }
```

Cache with SWR-like pattern (stale-while-revalidate), or simple fetch + useState.

---

## 5. Non-functional talablar

### 5.1 Mobile
- Tab nav horizontal scroll on small screens
- KPI kartalar: 1 col on mobile, 2 col on sm, 4 col on lg
- Jadvallar: card view on sm breakpoint pastida

### 5.2 Dark mode
- Mavjud pattern davom ettiriladi (`bg-white dark:bg-neutral-900`, `text-gray-900 dark:text-gray-100`)
- Chart tooltips dark-friendly (`#1f2937` backgound)

### 5.3 Performance
- Tab switching: lazy load komponentlar (React.lazy + Suspense)
- Har endpoint Promise.all bilan parallel fetch
- Large datasets: pagination (masalan Nasiya drill-down)

### 5.4 Excel/PDF eksport
- Har tab uchun "Excel eksport" tugma
- Excel: multi-sheet (umumiy + breakdown sheets)
- PDF: print-friendly layout (react-to-print yoki jsPDF)

### 5.5 URL-driven state
```
/hisobotlar?tab=moliya&tur=oylik&dan=2026-04-01&gacha=2026-04-30
```
- Share qilinadi, bookmark qilinadi, back/forward ishlaydi

### 5.6 Accessibility
- Tab'lar: ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- Drill-down modal: `role="dialog"`, `aria-labelledby`, Escape key
- Focus ring barcha interactive element'larda

---

## 6. Scope'dan tashqari (out of scope)

- ❌ Customer RFM/cohort analysis — kichik do'kon uchun overkill
- ❌ Budget vs Actual variance — advance planning kerak
- ❌ Vendor performance scorecards — alohida loyiha
- ❌ Forecasting / demand planning — ML/AI komponentlar
- ❌ Commission tracking — HR modul kerak
- ❌ Multi-store comparison — tizim single-store
- ❌ Real-time WebSocket updates — MVP uchun reload yetarli
- ❌ Scheduled email reports — alohida backend ish
- ❌ Test infra qo'shish — mavjud projectda yo'q, alohida loyiha

---

## 7. Amalga oshirish bosqichlari

### Faza 1: Foundation (7 task)
1. `src/lib/hisobotlar.ts` — shared helpers
2. `useReportFilters` hook (URL state)
3. `useReportData` hook (fetch wrapper)
4. `ReportFilter` komponent
5. `KPICard`, `TrendBadge`, `ReportSection` komponentlar
6. `SkeletonKPI/Chart/Table` komponentlar
7. Layout refactor: `page.tsx` faqat routing + filter + tab nav

### Faza 2: Existing tablarni ekstrakt qilish (7 task)
8-14: `UmumiyTab`, `SotuvTab`, `TovarlarTab`, `OmborTab`, `MijozlarTab`, `NasiyaTab`, `KassirlarTab` — har biri alohida fayl

### Faza 3: API reorganizatsiya (3 task)
15. Main `/api/hisobotlar/` — faqat KPI summary
16. `/api/hisobotlar/umumiy/` — overview detal
17. Mavjud endpoint'larni kategoriya bo'yicha ko'chirish (abc, dead-stock, etc.)

### Faza 4: Yangi hisobotlar (8 task)
18. `MoliyaTab` + `/api/hisobotlar/moliya/p-and-l`
19. Kategoriya sotuv: `/api/hisobotlar/sotuv/kategoriya` + SotuvTab update
20. Chegirma: `/api/hisobotlar/sotuv/chegirma` + SotuvTab update
21. To'lov trend: `/api/hisobotlar/sotuv/tolov-trend` + SotuvTab update
22. Returns: `/api/hisobotlar/sotuv/returns` + SotuvTab update
23. Stock turnover: `/api/hisobotlar/tovarlar/turnover` + TovarlarTab update
24. Nasiya drill-down: `/api/hisobotlar/nasiya/drill-down` + NasiyaTab modal
25. Xaridlar tab: `XaridlarTab` + `/api/hisobotlar/xaridlar/payables-aging`

### Faza 5: Polish (5 task)
26. Ombor valuation trend (optional)
27. Excel eksport per tab (multi-sheet)
28. PDF eksport (print-friendly)
29. Mobile responsive audit + fixes
30. Deploy + smoke test

---

## 8. Qabul mezoni

- [ ] `/hisobotlar` avvalgi barcha ma'lumotlarni ko'rsatadi (regression yo'q)
- [ ] 9 ta tab bor: Umumiy, Moliya, Sotuv, Tovarlar, Ombor, Mijozlar, Nasiya, Xaridlar, Kassirlar
- [ ] 5 ta yangi hisobot ishlaydi: P&L, Kategoriya sotuv, Returns, Payables aging, Stock turnover
- [ ] Nasiya aging bucket bosilganda drill-down ochiladi
- [ ] Filtrlar URL'ga yoziladi (share mumkin)
- [ ] Tab lazy-load qilinadi (performance)
- [ ] Mobile'da har tab normal ko'rinadi
- [ ] Dark mode barcha joy'da to'g'ri
- [ ] Excel eksport har tab uchun ishlaydi
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` muvaffaqiyatli
- [ ] Production deploy muvaffaqiyatli
