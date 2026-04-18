# Hisobotlar Senior Refactor — Implementation Plan

**Goal:** Mavjud `/hisobotlar` sahifasini refactor qilish + 5 ta kritik yangi hisobot qo'shish (P&L, Kategoriya sotuv, Returns, Payables aging, Stock turnover).

**Architecture:** Modular tab-based komponentlar + kategoriya-asosli API struktura. URL-driven state, lazy loading, Excel/PDF eksport.

**Tech Stack:** Next.js 16, React 19, Prisma 7, Tailwind 4, Radix UI, Recharts, xlsx.

**Spec reference:** `docs/superpowers/specs/2026-04-18-hisobotlar-senior-refactor-design.md`

---

## Faza 1: Foundation (shared infra)

### Task 1: Shared lib — `src/lib/hisobotlar.ts`
- `getReportDateRange(tur, dan?, gacha?)` → { dan, gacha, oldingi }
- `baseSotuvFilter(dan, gacha, kassirId?)` → Prisma where
- `foizOzgarish(joriy, oldingi)` → number | null
- `agingBucket(muddat, bugun)` → bucket name
- `commitText`: chore(lib): hisobotlar shared helpers

### Task 2: Hook `useReportFilters`
- Path: `src/app/(dashboard)/hisobotlar/_hooks/useReportFilters.ts`
- URL state: tab, tur, dan, gacha
- Functions: setTab, setTur, setSana
- commitText: feat(hisobotlar): URL-driven filter hook

### Task 3: Hook `useReportData` + components
- `useReportData<T>(endpoint, filtrlar)` — generic fetch wrapper
- `KPICard`, `TrendBadge`, `ReportSection` components
- `SkeletonKPI`, `SkeletonChart`, `SkeletonTable`
- Path: `src/app/(dashboard)/hisobotlar/_components/`
- commitText: feat(hisobotlar): shared UI components + data hook

### Task 4: `ReportFilter` + `ExportButton`
- `ReportFilter.tsx` — sana preset + custom range
- `ExportButton.tsx` — Excel/PDF download
- commitText: feat(hisobotlar): ReportFilter va ExportButton

### Task 5: Layout refactor — `page.tsx`
- Faqat layout (tab nav + filter + active tab lazy)
- `React.lazy` har tab uchun
- Barcha mavjud mazmun `_tabs/UmumiyTab.tsx` ga ko'chiriladi (default)
- commitText: refactor(hisobotlar): page.tsx layout shell + lazy tabs

---

## Faza 2: Mavjud tablarni ekstrakt qilish

### Task 6: `UmumiyTab.tsx`
- Mavjud Umumiy tab mazmunini alohida faylga
- KPI cards, sotuv grafik, to'lov pie, xarajat pie, top 10 tovar
- `useReportData('/api/hisobotlar')` bilan
- commitText: refactor(hisobotlar): UmumiyTab extracted

### Task 7: `SotuvTab.tsx`
- Mavjud Sotuv tab (peak hours heatmap + kunlik)
- commitText: refactor(hisobotlar): SotuvTab extracted

### Task 8: `TovarlarTab.tsx`
- ABC analysis + Dead stock
- commitText: refactor(hisobotlar): TovarlarTab extracted

### Task 9: `OmborTab.tsx`
- commitText: refactor(hisobotlar): OmborTab extracted

### Task 10: `MijozlarTab.tsx`
- commitText: refactor(hisobotlar): MijozlarTab extracted

### Task 11: `NasiyaTab.tsx`
- Aging bucket'lar + top 20 qarzdor
- commitText: refactor(hisobotlar): NasiyaTab extracted

### Task 12: `KassirlarTab.tsx`
- commitText: refactor(hisobotlar): KassirlarTab extracted

---

## Faza 3: API reorganizatsiya

### Task 13: `/api/hisobotlar/umumiy` — detail endpoint
- Hozirgi main endpoint'dan overview fields (grafikData, topTovarlar, tolovUsullari)
- Main endpoint faqat KPI summary qaytaradi
- commitText: refactor(api/hisobotlar): umumiy endpoint ajratildi

### Task 14: Mavjud endpointlarni kategoriya ostiga ko'chirish
- `/api/hisobotlar/soatlar` → `/api/hisobotlar/sotuv/peak-hours`
- `/api/hisobotlar/abc` → `/api/hisobotlar/tovarlar/abc`
- `/api/hisobotlar/dead-stock` → `/api/hisobotlar/tovarlar/dead-stock`
- `/api/hisobotlar/nasiya-aging` → `/api/hisobotlar/nasiya/aging`
- Eski URL'lar redirect qoldiriladi (backward compat)
- Frontend hooks yangi URL'ga yo'naltiriladi
- commitText: refactor(api/hisobotlar): kategoriya ostida qayta tashkil

---

## Faza 4: Yangi hisobotlar (asosiy ish)

### Task 15: 🆕 P&L endpoint + MoliyaTab
- `src/app/api/hisobotlar/moliya/p-and-l/route.ts`
- Response: revenue, cogs, grossProfit, opex, netProfit, margin, oldingi, foiz, trend
- `_tabs/MoliyaTab.tsx`: 4 KPI + P&L jadval + trend chart (stacked area)
- commitText: feat(hisobotlar): P&L Statement (Moliya tab)

### Task 16: 🆕 Kategoriya sotuv
- `/api/hisobotlar/sotuv/kategoriya/route.ts`
- Response: categories[] with revenue, qty, margin, topProducts, trend
- `SotuvTab.tsx`'ga horizontal bar chart + jadval
- commitText: feat(hisobotlar): kategoriya bo'yicha sotuv tahlili

### Task 17: 🆕 Chegirma tahlili
- `/api/hisobotlar/sotuv/chegirma/route.ts`
- `SotuvTab.tsx` ga chegirma breakdown
- commitText: feat(hisobotlar): chegirmalar ta'siri tahlili

### Task 18: 🆕 To'lov usuli trend
- `/api/hisobotlar/sotuv/tolov-trend/route.ts`
- Stacked area chart (NAQD/KARTA/NASIYA vaqt bo'yicha)
- commitText: feat(hisobotlar): to'lov usuli dinamikasi

### Task 19: 🆕 Returns tahlili
- `/api/hisobotlar/sotuv/returns/route.ts`
- Response: umumiy, bySabab[], topReturnedProducts[], trend[]
- SotuvTab'da yangi bo'lim
- commitText: feat(hisobotlar): qaytarishlar tahlili

### Task 20: 🆕 Stock turnover
- `/api/hisobotlar/tovarlar/turnover/route.ts`
- Response: ortachaTurnoverKun, tovarlar[] with klass
- `TovarlarTab.tsx` ga yangi jadval
- commitText: feat(hisobotlar): stock turnover tahlili

### Task 21: 🆕 Nasiya drill-down
- `/api/hisobotlar/nasiya/drill-down/route.ts?bucket=b_0_30`
- `_components/DrillDownModal.tsx`
- `NasiyaTab.tsx` da aging karta bosilsa modal ochiladi
- commitText: feat(hisobotlar): nasiya aging drill-down modal

### Task 22: 🆕 XaridlarTab (Payables aging)
- `/api/hisobotlar/xaridlar/payables-aging/route.ts`
- `_tabs/XaridlarTab.tsx`: 5 aging bucket + top 20 ta'minotchi + drill-down
- commitText: feat(hisobotlar): Xaridlar tab — payables aging

---

## Faza 5: Polish va deploy

### Task 23: Ombor valuation trend (optional)
- `/api/hisobotlar/ombor/valuation-trend/route.ts`
- `OmborTab.tsx` ga kunlik qiymat chart
- commitText: feat(hisobotlar): ombor qiymati trendi

### Task 24: Excel eksport per tab
- Har tab uchun multi-sheet Excel
- commitText: feat(hisobotlar): Excel eksport har tab uchun

### Task 25: PDF eksport (optional)
- commitText: feat(hisobotlar): PDF eksport

### Task 26: Mobile audit + dark mode check
- Barcha tablar telefonda sinaladi
- Dark mode visual audit
- commitText: fix(hisobotlar): mobile + dark mode sozlash

### Task 27: Final typecheck + build + deploy
- `npx tsc --noEmit` clean
- `npm run build` muvaffaqiyatli
- Deploy production

---

## Qabul mezoni

- [ ] 9 tab ishlaydi: Umumiy, Moliya, Sotuv, Tovarlar, Ombor, Mijozlar, Nasiya, Xaridlar, Kassirlar
- [ ] 5 ta yangi hisobot: P&L, Kategoriya, Returns, Payables aging, Stock turnover
- [ ] Drill-down modal (Nasiya aging + Payables aging)
- [ ] URL-driven filter (shareable)
- [ ] Lazy tab loading
- [ ] Excel eksport har tab uchun
- [ ] Mobile + Dark mode OK
- [ ] `tsc --noEmit` + `npm run build` clean
- [ ] Production deploy muvaffaqiyatli
