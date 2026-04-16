# Sotuvlar hisoboti sahifasi — dizayn spetsifikatsiyasi

**Sana:** 2026-04-16
**Muallif:** Biznesjon + Claude
**Maqsad:** Dashboard "Sotuv" kartasini bosilganda ochiladigan professional analitika sahifasi

---

## 1. Maqsad va kontekst

Dashboard'da "Sotuv" kartasi bor lekin u bosilmaydi — faqat jami raqam ko'rsatadi. Professional ERP'larda (Stripe, Linear, Shopify) bunday summary kartalar **clickable** bo'lib, batafsil analitika sahifasiga olib boradi.

Yangi `/sotuvlar` sahifasi **4 ta asosiy savolga javob beradi**:
- **Kim sotgan?** — Kassirlar bo'yicha ranjirovka
- **Kimlar?** — Sotuvlar ro'yxati batafsil tarkib bilan
- **Kimga?** — Mijozlar bo'yicha tahlil
- **Qanday?** — To'lov usullari taqsimoti (NAQD / KARTA / ARALASH / NASIYA / SHERIK)

### Foydalanuvchi hikoyalari

**FH-1 (Egasi — eng muhim):** Do'kon egasi dashboard'da "Sotuv: 7.3M so'm" kartasini ko'rib, bu oyda qancha sotilganini batafsil bilmoqchi — kim sotdi, qaysi tovarlar, qanday to'lovlar bilan, o'tgan oyga nisbatan qanday. Bir marta bosib to'liq picture olishi kerak.

**FH-2 (Menejer):** Menejer kassirlar ishini tekshirmoqchi — eng faol kassir kim, eng ko'p qaytarishlar kimda, kassir bo'yicha o'rtacha chek qancha.

**FH-3 (Buxgalter):** Buxgalter oy oxirida NAQD vs KARTA taqsimotini Excel'ga yuklab olib, hisob-kitob uchun ishlatmoqchi.

**FH-4 (Egasi — mijoz tahlili):** Eng yaxshi mijozlar kimligini ko'rib, ularga maxsus shartlar yoki loyalty chegirmasi berish.

**FH-5 (Har kim):** Aniq bir sotuvni topib, uning tarkibini, qaytarishlarini, nasiyasini bir ekranda ko'rish.

---

## 2. Umumiy arxitektura

### Route va entry point'lar

| Element | Qiymat |
|---|---|
| URL | `/sotuvlar` (plural, POS `/sotuv` bilan chalkashmaydi) |
| Dashboard'dan | "Sotuv" kartasi `<Link href="/sotuvlar">` ga o'ralgan, hover'da `ring-2 ring-red-500/40` + `cursor-pointer` |
| Sidebar | "Sotuv (POS)" ostiga "Sotuvlar hisoboti" qo'shilmaydi (dashboard kartadan kirish yetarli; sidebar shovqini) |
| Keyboard | `g s` (go-to sales) — optional, keyin qo'shish mumkin |

### Komponent daraxti

```
SotuvlarPage (server component + 'use client' Island'lar)
├── PageHeader (sticky)
│   ├── Breadcrumb
│   ├── DateRangePicker
│   ├── ActiveFilterChips (URL params bilan sinxron)
│   └── ActionBar (Excel eksport, Chop etish)
├── HeroMetrics
│   ├── PrimaryMetric (JAMI SOTUV — 2x o'lcham, sparkline + comparison)
│   └── SecondaryMetrics (Soni, O'rtacha, Foyda — 3 ta)
├── SalesTrendChart (AreaChart + o'tgan davr solishtirish chizig'i)
├── BreakdownTabs
│   ├── Tab: Kassirlar
│   ├── Tab: Mijozlar
│   ├── Tab: To'lov usuli (Donut + jadval)
│   ├── Tab: Tovarlar
│   └── Tab: Soatlar (peak hours)
├── SalesTable (sticky header, keyboard nav, bulk select)
└── SaleDetailPanel (slide-out right; mobile'da bottom sheet)
```

### Ma'lumot oqimi

```
/sotuvlar?dan=2026-04-01&gacha=2026-04-16&kassirId=x&tolov=NAQD
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  /api/sotuvlar     /api/sotuvlar/analitika   /api/foydalanuvchilar
  (pagination,       (agg, trends,             (filter select uchun)
   list view)        comparisons)              /api/mijozlar
                                               (filter select uchun)
```

---

## 3. Backend API

### 3.1 Yangi endpoint: `GET /api/sotuvlar/analitika`

**Query params:**

| Param | Tur | Default | Misol |
|---|---|---|---|
| `dan` | ISO date | shu oy 1-kuni | `2026-04-01` |
| `gacha` | ISO date | bugun | `2026-04-16` |
| `kassirId` | string? | — | `cm...` |
| `mijozId` | string? | — | `cm...` |
| `tolovUsuli` | enum? | — | `NAQD` |

**Javob shakli:**

```typescript
{
  // Hero metrics
  jamiSotuv: number          // yakuniySumma sum (qaytarishlardan tashqari)
  jamiQaytarish: number      // davrdagi qaytarishlar
  sotuvSoni: number          // yakunlangan sotuvlar soni
  ortachaChek: number        // jamiSotuv / sotuvSoni
  jamiFoyda: number          // (sotishNarxi - kelishNarxi) * miqdor sum
  jamiChegirma: number

  // Taqqoslash (oldingi davr — xuddi shu davr uzunligi)
  oldingiDavr: {
    jamiSotuv: number
    sotuvSoni: number
    ortachaChek: number
    jamiFoyda: number
  }

  // Grafik (kunlar bo'yicha)
  kunlikGrafik: Array<{
    sana: string              // "2026-04-01"
    sotuv: number
    sotuvSoni: number
    oldingiSotuv: number      // shu kunning oldingi davrdagi qiymati
  }>

  // Kassirlar bo'yicha
  kassirlar: Array<{
    kassirId: string
    ism: string
    sotuvSoni: number
    jami: number
    ortachaChek: number
    foyda: number
    qaytarishlarSoni: number
  }>

  // Mijozlar bo'yicha (top 20)
  mijozlar: Array<{
    mijozId: string
    ism: string
    telefon: string | null
    sotuvSoni: number
    jami: number
    nasiyaQoldiq: number
  }>

  // To'lov usullari bo'yicha
  tolovUsullari: Array<{
    tolovUsuli: TolovUsuli
    sotuvSoni: number
    jami: number
    ulush: number              // foiz
  }>

  // Top tovarlar (davr ichida)
  topTovarlar: Array<{
    tovarId: string
    nomi: string
    birlik: string
    miqdor: number
    jami: number
    foyda: number
  }>

  // Soatlar bo'yicha (0-23)
  soatlar: Array<{
    soat: number               // 0-23
    sotuvSoni: number
    jami: number
  }>
}
```

**Implementation izohlari:**
- `prisma.sotuv.groupBy` va `prisma.sotuvTarkibi.groupBy` parallel ishlatiladi (Promise.all)
- `SHERIK` to'lov usulidagi sotuvlar `jamiSotuv`dan chiqariladi (hozirgi `/api/hisobotlar` dagi qoida saqlanadi)
- `BEKOR_QILINGAN` sotuvlar chiqariladi
- Foyda hisoblash: `(birlikNarxi - tovar.kelishNarxi) * miqdor` har `SotuvTarkibi` uchun
- **Oldingi davr**: joriy davr uzunligiga teng oldingi davr (misol: 16 kunlik oraliq uchun, oldingisi 32 kun oldindan 16 kun oldingacha)

### 3.2 Mavjud endpoint kengaytirilishi: `GET /api/sotuvlar`

Hozirgi holat: `page`, `limit`, `dan`, `gacha`, `chekRaqami` qabul qiladi.

**Qo'shiladigan filtrlar:**

| Param | Tur | Ta'sir |
|---|---|---|
| `kassirId` | string? | `where.kassirId` |
| `mijozId` | string? | `where.mijozId` |
| `tolovUsuli` | enum? | `where.tolovUsuli` |
| `q` | string? | `chekRaqami` yoki `mijoz.ism` yoki `mijoz.telefon` bo'yicha qidiruv (OR) |
| `sort` | `"sana"\|"summa"\|"kassir"` | saralash maydoni |
| `order` | `"asc"\|"desc"` | saralash yo'nalishi |

Boshqa o'zgarishlar yo'q. Mavjud chaqiruvchilar (kassa sahifasi) buzilmaydi.

### 3.3 Excel eksport: `GET /api/sotuvlar/export`

Xuddi `/api/sotuvlar` filtrlarini qabul qiladi, lekin:
- Pagination yo'q (butun davr)
- Javob turi: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `xlsx` kutubxonasi bilan file stream

**Excel sahifalari (sheets):**
1. **Sotuvlar** — har bir sotuv bitta qator (sana, chek#, kassir, mijoz, to'lov, summa, chegirma, yakuniy, foyda)
2. **Tarkiblar** — har bir SotuvTarkibi bitta qator (chek#, tovar, miqdor, narx, jami)
3. **Xulosa** — kassirlar/to'lov usullari/kunlik jami xulosalari

---

## 4. Sahifa tarkibi — batafsil

### 4.1 PageHeader (sticky top)

```
┌─────────────────────────────────────────────────────────────┐
│ Sotuvlar hisoboti                      [⬇ Excel] [🖨 Chop]  │
│ 🗓 1-apr – 16-apr (shu oy) ▾      Ctrl+F qidiruv            │
│ [Kassir: Aziz ×]  [To'lov: NAQD ×]  [Clear all]             │
└─────────────────────────────────────────────────────────────┘
```

**Sana selektori presetlari:** Bugun · Kecha · Oxirgi 7 kun · **Shu oy (default)** · O'tgan oy · Maxsus
- Maxsus tanlansa 2 ta date input ochiladi.
- Tanlov URL query'ga yoziladi → sahifa share qilinadi.

**Aktiv filter chip'lari:**
- Har biri `×` bilan alohida o'chiriladi.
- "Clear all" barchasini tozalaydi + URL ni reset qiladi.

### 4.2 HeroMetrics

```
┌──────────────────────────────┐ ┌──────────────┐
│ JAMI SOTUV                   │ │ Sotuvlar     │
│ 47,250,000 so'm              │ │ 234 ta       │
│ ▲ +18.2% o'tgan oyga         │ │ ▲ +12%       │
│ ╱╲╱╲──╱╲╱─ sparkline         │ └──────────────┘
│                              │ ┌──────────────┐
│ [2 column x 1 row — katta]   │ │ O'rtacha     │
└──────────────────────────────┘ │ chek         │
                                 │ 202,000      │
                                 │ ▼ -3%        │
                                 └──────────────┘
                                 ┌──────────────┐
                                 │ Sof foyda    │
                                 │ 12,400,000   │
                                 │ ▲ +22%       │
                                 └──────────────┘
```

- Hero karta: `col-span-2 row-span-1` (desktop); mobile'da full-width.
- Sparkline: so'nggi 14 kunlik mini chart, aniq `recharts` `LineChart` `<Line strokeWidth={1.5} />` h-8.
- Comparison: `▲`/`▼` ikonka + foiz. Yashil agar ijobiy yo'nalish (sotuv/foyda uchun ko'tarilish, chegirma uchun tushish), qizil aksincha.
- 3 ta kichik karta: `col-span-1` har biri.

### 4.3 SalesTrendChart

```
Sotuv dinamikasi                                    ⓘ
─── Shu oy  ─── O'tgan oy (solishtirish)
  
  6M ┤        ╱╲
  4M ┤    ╱╲╱  ╲        ╲── Hover tooltip:
  2M ┤───      ──── ─── ────  "10-apr: 5.2M (o'tgan oy: 4.1M, +26%)"
  0  └──────────────────────
     1     8    15    22    30
```

- Recharts `AreaChart` + solishtiruvchi `Line` chiziq.
- Hover tooltip har ikkala davr qiymatini va foizlik farqni ko'rsatadi.
- Balandlik: `h-64` desktop, `h-48` mobile.

### 4.4 BreakdownTabs

```
[Kassirlar] [Mijozlar] [To'lov] [Tovarlar] [Soatlar]
  Faol tab     Inactive
──────────────────────────────────────────────────────
Tab ichidagi tarkib: chap tomonda grafik, o'ngda jadval
```

**Kassirlar tabi:**
- Horizontal bar chart (jami sotuv bo'yicha)
- Jadval: Ism · Sotuv soni · Jami · O'rtacha chek · Foyda · Qaytarishlar
- Qatorga bosish → pastdagi jadval `kassirId` bilan filtrlanadi (`/sotuvlar?kassirId=...`)

**Mijozlar tabi:**
- Top 20 mijozlar bar chart
- Jadval: Ism · Telefon · Sotuv soni · Jami · Nasiya qoldiq
- Qatorga bosish → jadval `mijozId` bilan filtrlanadi

**To'lov usuli tabi:**
- **Donut chart** + markazda `Jami: 47.2M`
- Legend: rang, nomi, summa, ulush (foiz)
- Jadval: To'lov usuli · Soni · Jami · Ulush

**Tovarlar tabi:**
- Top 20 tovar jami sotuv bo'yicha (bar chart)
- Jadval: Tovar · Miqdor · Jami · Foyda · ABC-class
- Qatorga bosish → tovar detal sahifaga (agar mavjud bo'lsa; aks holda faqat jadvalni filtrlaydi)

**Soatlar tabi:**
- 24-soatlik bar chart (0-23)
- Peak hours vizualizatsiya qilingan (eng yuqori 3 ta soat highlight)
- Jadval: Soat · Sotuv soni · Jami · % ulush

### 4.5 SalesTable (jadval)

```
🔍 Qidiruv: [                    ]    Jami: 234 ta sotuv
┌──┬────────┬────────┬────────┬────────┬────────┬────────┐
│☐ │ Sana ▼ │ Chek#  │ Kassir │ Mijoz  │ To'lov │ Summa  │
├──┼────────┼────────┼────────┼────────┼────────┼────────┤
│☐ │ 16/4   │ #7421  │ Aziz   │ Jahon  │ NAQD   │ 450K   │
│☐ │ 16/4   │ #7420  │ Aziz   │ —      │ KARTA  │ 120K   │
│☐ │ 16/4   │ #7419  │ Bekzod │ Alisher│ NASIYA │ 1.2M   │
└──┴────────┴────────┴────────┴────────┴────────┴────────┘
< 1 2 3 ... 12 >   50 ta/sahifa
```

**Ustunlar:**
1. Checkbox (bulk select)
2. Sana — `dd/MM HH:mm` formatda
3. Chek# — click'da slide-out ochiladi
4. Kassir — ism
5. Mijoz — ism yoki `—` (agar yo'q bo'lsa)
6. To'lov — badge rang bilan (NAQD=yashil, KARTA=ko'k, NASIYA=sariq, ARALASH=binafsha, SHERIK=kulrang)
7. Summa — o'ng tomonga tekislangan, `formatSum`
8. (optional desktop-only) Foyda — yashil/qizil
9. (optional desktop-only) Holati — `YAKUNLANGAN` / `BEKOR_QILINGAN` badge

**Xususiyatlari:**
- Sticky header skroll vaqtida
- Qator hover: `bg-red-50 dark:bg-red-950/20` + cursor-pointer
- Klaviatura: `↑↓` qatorlar, `Enter` detail, `Esc` yopish, `/` qidiruv focus, `Ctrl+A` hammasi
- Sortable: Sana, Summa ustunlari click bilan saralanadi (backend `sort` param)
- Pagination: 20/50/100 tanlanadigan; navbar prev/next + sahifa tanlash
- Bulk tanlanganda yuqori o'ngda "X ta tanlangan · Excel eksport · Chop etish" panel chiqadi

### 4.6 SaleDetailPanel (slide-out)

Qatorga bosilganda o'ng tomondan `w-[480px]` (desktop) yoki `bottom sheet` (mobile) ochiladi.

```
┌───────────────────────────────────────────┐
│ Chek #7421                        [◀ ▶ ✕] │
│ 16-apr-2026, 14:32                        │
│ [YAKUNLANGAN badge]                       │
├───────────────────────────────────────────┤
│ Kassir:  Aziz Rahimov                     │
│ Mijoz:   Jahongir (998 90 123 45 67)      │
│ To'lov:  NAQD — 450,000 so'm              │
├───────────────────────────────────────────┤
│ TARKIB (3 ta tovar)                       │
│ • Qazon 65sm × 1 dona — 380,000           │
│ • Odnorazviy TE-2 × 5 dona — 50,000       │
│ • Qoshiq × 2 dona — 20,000                │
├───────────────────────────────────────────┤
│ Summa:       450,000                      │
│ Chegirma:    0                            │
│ Yakuniy:     450,000                      │
│ Foyda:       120,000 (26.7%)              │
├───────────────────────────────────────────┤
│ NASIYA (agar bor bo'lsa)                  │
│ Muddat: 16-may · Qoldiq: 200,000          │
├───────────────────────────────────────────┤
│ QAYTARISHLAR (agar bor bo'lsa)            │
│ 17-apr: Qoshiq × 1 — 10,000               │
├───────────────────────────────────────────┤
│ [🖨 Chek chop etish]  [🔗 Linkni ulashish]│
└───────────────────────────────────────────┘
```

**Xususiyatlari:**
- `◀ ▶` tugmalar yoki `Alt+←` / `Alt+→` oldingi/keyingi sotuvga o'tish (jadvalda tartib bo'yicha)
- `✕` yoki `Esc` yopadi
- Chek chop etish `/chek/[chekRaqami]` ga o'tadi (mavjud public chek sahifasi)
- Link ulashish — `navigator.clipboard` orqali `/chek/[chekRaqami]` URL'ini nusxalaydi
- Ma'lumot `/api/sotuvlar?chekRaqami=...` endpoint'idan keladi (mavjud, to'liq ma'lumot qaytaradi)

### 4.7 Loading, empty va error holatlar

**Loading:**
- Birinchi load: skeleton loader'lar har bo'limda (hero cards, chart, tabs, table)
- Filter o'zgarishi: jadval yuqorisida yupqa progress bar (2px)
- Yo'qotmaslik: hozirgi ma'lumot o'rnida qoladi, faqat shaffoflik bilan

**Empty state:**
- Davrda sotuv yo'q: illustratsiya + "Ushbu davrda sotuv topilmadi" + "Filterni o'zgartiring" tugmasi
- Jadval bo'sh (filtrdan keyin): mini empty state qatorlar o'rnida

**Error:**
- API xato: banner yuqorida "Ma'lumotni yuklash muvaffaqiyatsiz. [Qayta urinish]"
- Optimistic UI yo'q (ma'lumot ko'p, xato potentsial bor — silent fail xavfli)

---

## 5. Non-functional talablar

### 5.1 Mobile strategiyasi

| Breakpoint | O'zgarish |
|---|---|
| `< sm` (640px) | Hero: kartalar stack. Tabs: horizontal scroll. Jadval: card view (har sotuv karta, grid emas). Detail: bottom sheet (`h-[85vh]`). |
| `sm - md` | Hero: 2-column grid. Jadval: compact columns (foyda yashirilgan). |
| `≥ lg` | To'liq layout yuqorida tasvirlangandek. |

### 5.2 Performance

- **Pagination:** default 50 ta, maksimum 100 (keyingi sahifalar lazy fetch)
- **Analitika endpoint:** Prisma `groupBy` va `aggregate` — SQL darajasida, client'da hisob yo'q
- **Bir nechta parallel fetch:** `Promise.all` (hero + chart + breakdowns + jadval) — 4 ta parallel so'rov
- **Analitika fetch'i jadvaldan mustaqil:** jadval sahifalashi analitikani qayta chaqirmaydi

### 5.3 Accessibility (a11y)

- Har slide-out modal `role="dialog"` + `aria-labelledby`
- Tabs: ARIA `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Jadval: `<table>` semantikasi (Div'lar emas) keyboard nav uchun muhim
- Focus ring: hamma interactive element'da aniq (`focus-visible:ring-2 ring-red-500`)
- Rang kontrasti: WCAG AA (matn ≥ 4.5:1)
- Screen reader: "234 ta sotuv topildi, 1-sahifa 5-sahifadan" kabi live region

### 5.4 Dark mode

Loyihada dark mode allaqachon sozlangan (`dark:bg-neutral-900` pattern'i). Yangi sahifa shu standartga amal qiladi:
- Card fon: `bg-white dark:bg-neutral-900`
- Chegara: `border-gray-200 dark:border-neutral-800`
- Matn: `text-gray-900 dark:text-gray-100`
- Accent: `bg-red-500` / `text-red-600` (dark'da ham bir xil)
- Chart tooltip: `#1f2937` (dark-safe), `#f9fafb` matn

### 5.5 URL-driven state

Barcha filter URL'da saqlanadi:
```
/sotuvlar?dan=2026-04-01&gacha=2026-04-16&kassirId=cm123&tolov=NAQD&sort=sana&order=desc&page=2
```
- Share qilinadi
- Back/forward brauzer tugmalari ishlaydi
- Bookmark qilinadi

---

## 6. Sifat darvozalari (CLAUDE.md talabiga muvofiq)

**Har qadamda:**
- `npx tsc --noEmit` — TypeScript xato yo'q
- `npm run lint` — ESLint xato yo'q
- Manual smoke test: sotuv yarating → sahifaga o'ting → ma'lumot ko'rinadi → filtr ishlaydi → detail ochiladi

**Yakunlangan feature uchun:**
- `npm run build` — build muvaffaqiyatli
- Prisma schema o'zgarmadi → migration kerak emas
- Commit message Conventional Commits formatida

**Testlar:**
Loyihada hozirda test infratuzilmasi yo'q (Vitest/Jest/Playwright hech qaysi yo'q). Ushbu spec doirasida **test infra qo'shmaslik** — bu alohida loyiha. Shu feature uchun **manual test plan** yetarli (7-bo'limda).

> **Qaror:** Test infra qo'shish CLAUDE.md'dagi "Test bor" talabidan farqli holat — loyiha darajasida yo'q. Agar test qo'shilishi kerak bo'lsa, alohida brainstorming sessiya kerak (Vitest tanlash, Prisma mock strategiyasi, CI integration). Hozirgi spec faqat manual test planga tayanadi.

---

## 7. Manual test plan

### Smoke testlari
1. Dashboard'da "Sotuv" kartani bosish → `/sotuvlar` ochiladi
2. Default davr = shu oy 1-kunidan bugungacha
3. Hero metric jami sotuv ko'rinadi, 3 kichik metric ham
4. Chart yuklanadi, 2 ta chiziq (shu oy + o'tgan oy)
5. Tab'lar ishlaydi (hech qaysi tabda xato yo'q)
6. Jadval yuklanadi, pagination ishlaydi
7. Qatorga bosilganda slide-out ochiladi
8. Slide-out ichida chek raqami, tarkib, kassir, mijoz to'g'ri ko'rinadi

### Filter testlari
1. Sana o'zgartirish → KPI va grafik qayta hisoblaydi
2. Preset tugma (Bugun / Hafta / Oy) ishlaydi
3. Kassir filter → faqat o'sha kassir sotuvlari ko'rinadi
4. Mijoz filter → faqat o'sha mijoz sotuvlari
5. To'lov usuli filter
6. Qidiruv — chek raqami bo'yicha
7. Qidiruv — mijoz ismi bo'yicha
8. "Clear all" barcha filter'ni reset qiladi
9. URL'ga filter yoziladi, sahifa reload'da tiklanadi

### Detail panel testlari
1. `◀ ▶` oldingi/keyingi sotuvga o'tadi
2. `Esc` yopadi
3. Chek chop etish `/chek/[raqam]`'ga o'tadi
4. Link nusxalash clipboard'ga yoziladi
5. Nasiya mavjud sotuv → nasiya ma'lumoti ko'rinadi
6. Qaytarish mavjud → qaytarishlar bo'limi ko'rinadi

### Eksport testlari
1. Excel eksport — faol filtr bilan yuklanadi
2. Excel ichida 3 ta sheet bor (Sotuvlar, Tarkiblar, Xulosa)
3. Eksport ma'lumoti ekrandagi filtr bilan mos keladi

### Responsive testlari
1. Mobile (375px): jadval card view'ga aylanadi
2. Mobile: detail panel bottom sheet
3. Tablet (768px): 2-column grid
4. Desktop (1280px): to'liq layout

### Dark mode testlari
1. Theme toggle → barcha kartalar, jadval, grafik dark'da to'g'ri ko'rinadi
2. Chart tooltip dark'da o'qiladigan (`#1f2937` fon, `#f9fafb` matn)

---

## 8. Scope'dan tashqari (out of scope)

Quyidagilar bu spec ichida **EMAS** (keyinroq alohida yo'naltiriladi):

- ❌ Test infratuzilmasi (Vitest/Playwright) — alohida loyiha
- ❌ Real-time ma'lumot yangilanish (WebSocket/polling) — MVP uchun sahifa reload yetarli
- ❌ Saqlangan view'lar (bookmarked presets) — URL-based share MVP uchun yetarli
- ❌ Kassirlar/mijozlar maxsus detail sahifalari (`/kassirlar/[id]`) — shu sahifa chegarasida faqat filter qilish
- ❌ Sotuvni tahrirlash/bekor qilish slide-out ichidan — faqat ko'rish
- ❌ AI-insight cards ("eng faol kassir...") — keyingi iteratsiya
- ❌ PDF eksport — user Excel'ni tanladi, PDF keyinroq
- ❌ Chop etish (print stylesheet) — user eksportni tanladi
- ❌ Tovarlar detal sahifasiga link — tovar detal sahifasi hali yo'q
- ❌ Sidebar menyusiga element qo'shish — dashboard kartadan kirish yetarli

---

## 9. Ochiq savollar (implementation bosqichida hal etiladi)

1. **Sparkline ma'lumoti qayerdan?** — Analitika endpoint `kunlikGrafik` allaqachon bor, hero sparkline shuni qisqartirib ishlatadi (oxirgi 14 kun).
2. **Chart kutubxonasi:** Recharts (allaqachon ishlatilyapti) — boshqa kerak emas.
3. **URL state management:** Next.js `useSearchParams` + `useRouter.replace` — external kutubxona shart emas.
4. **Debounce qidiruv:** 300ms, `setTimeout` bilan oddiy.

---

## 10. Amalga oshirish bosqichlari (yuqori darajadagi)

Quyidagi bosqichlar writing-plans skill'i orqali batafsil rejaga aylantiriladi:

1. **Backend:** `/api/sotuvlar/analitika` endpoint
2. **Backend:** `/api/sotuvlar` filter'larini kengaytirish
3. **Backend:** `/api/sotuvlar/export` (Excel) endpoint
4. **Frontend:** `/sotuvlar/page.tsx` + komponentlar jildi (`src/app/(dashboard)/sotuvlar/_components/`)
5. **Frontend:** `HeroMetrics`, `SalesTrendChart`, `BreakdownTabs` komponentlari
6. **Frontend:** `SalesTable` + `SaleDetailPanel`
7. **Integration:** Dashboard "Sotuv" kartani `<Link>` qilish
8. **Manual test:** 7-bo'limdagi to'liq test plan
9. **Commit:** Conventional Commits bilan feat/fix'lar

---

## Xulosa

Bu spec `/sotuvlar` sahifasini **professional senior-darajadagi** ERP analitika sahifasiga aylantiradi:

- ✅ Vizual iyerarxiya (hero metric + ergash metric'lar)
- ✅ Taqqoslash kontekstida (o'tgan davrga nisbatan)
- ✅ Tabbed breakdowns (kognitiv yuk kam)
- ✅ Drill-down slide-out panel (prev/next navigatsiya)
- ✅ Klaviatura navigatsiyasi
- ✅ Mobile-responsive (bottom sheet)
- ✅ Dark mode
- ✅ URL-driven state (share, bookmark)
- ✅ Excel eksport (3 sheet)
- ✅ Skeleton loaders (2026 standart)
- ✅ A11y (ARIA, focus management)
