# Sotuvlar Hisoboti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard "Sotuv" kartasini bosilganda ochiladigan professional `/sotuvlar` analitika sahifasini yaratish — hero metric + taqqoslash, breakdown tab'lari (kassir/mijoz/to'lov/tovar/soat), pagination'lik jadval, slide-out detail panel, Excel eksport — barcha senior-level test infra (Vitest + Playwright + CI) bilan qoplangan.

**Architecture:** Next.js 16 App Router sahifasi (`src/app/(dashboard)/sotuvlar/`). Backend'da 3 ta endpoint: analitika aggregatsiyasi, filtrlangan ro'yxat, Excel eksport. Frontend: URL-driven state hook + 8 ta focused komponent. Test strategy: Vitest + `vitest-mock-extended` bilan Prisma mock, React Testing Library komponentlar uchun, Playwright E2E. CI: GitHub Actions lint + test + e2e parallel job'larda.

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript 5, Prisma 7 + PostgreSQL, Tailwind 4, Radix UI, Recharts, xlsx, Vitest 2.x, Playwright 1.50+, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-16-sotuvlar-hisoboti-design.md`

---

## Fayl tuzilmasi

### Yangi yaratiladigan fayllar

**Test infratuzilmasi:**
- `vitest.config.ts`
- `playwright.config.ts`
- `test/setup.ts`
- `test/mocks/prisma.ts`
- `test/mocks/session.ts`
- `test/unit/sanity.test.ts`
- `.github/workflows/ci.yml`

**Backend (manbakod + testlar):**
- `src/lib/analitika.ts` (pure functions — foyda, taqqoslash, soatlar)
- `test/unit/analitika-math.test.ts`
- `src/app/api/sotuvlar/analitika/route.ts`
- `test/integration/api-sotuvlar-analitika.test.ts`
- `test/integration/api-sotuvlar-filter.test.ts` (mavjud route kengaytmasi uchun)
- `src/app/api/sotuvlar/export/route.ts`
- `test/integration/api-sotuvlar-export.test.ts`

**Frontend (komponentlar + testlar):**
- `src/app/(dashboard)/sotuvlar/page.tsx`
- `src/app/(dashboard)/sotuvlar/_types.ts`
- `src/app/(dashboard)/sotuvlar/_hooks/useSotuvlarFilters.ts`
- `src/app/(dashboard)/sotuvlar/_components/SkeletonLoaders.tsx`
- `src/app/(dashboard)/sotuvlar/_components/DateRangePicker.tsx`
- `src/app/(dashboard)/sotuvlar/_components/ActiveFilterChips.tsx`
- `src/app/(dashboard)/sotuvlar/_components/HeroMetrics.tsx`
- `src/app/(dashboard)/sotuvlar/_components/SalesTrendChart.tsx`
- `src/app/(dashboard)/sotuvlar/_components/BreakdownTabs.tsx`
- `src/app/(dashboard)/sotuvlar/_components/SalesTable.tsx`
- `src/app/(dashboard)/sotuvlar/_components/SaleDetailPanel.tsx`
- `test/components/HeroMetrics.test.tsx`
- `test/components/DateRangePicker.test.tsx`
- `test/components/ActiveFilterChips.test.tsx`
- `test/components/SalesTable.test.tsx`
- `test/components/SaleDetailPanel.test.tsx`
- `test/components/BreakdownTabs.test.tsx`

**E2E:**
- `e2e/sotuvlar.spec.ts`
- `e2e/export.spec.ts`

### O'zgartiriladigan fayllar

- `package.json` — yangi dependencies + npm script'lar
- `src/app/api/sotuvlar/route.ts` — filter'lar kengaytirish (`kassirId`, `mijozId`, `tolovUsuli`, `q`, `sort`, `order`)
- `src/app/(dashboard)/page.tsx` — Sotuv kartani `<Link>` ga o'rash
- `.gitignore` — `coverage/`, `playwright-report/`, `test-results/` qo'shish (agar yo'q bo'lsa)

---

## FAZA 1: TEST INFRATUZILMASI

### Task 1: Test bog'liqliklarini o'rnatish

**Files:**
- Modify: `package.json`

- [ ] **Step 1: O'rnatish**

Run:
```bash
npm install -D vitest@^2.1.0 @vitest/ui@^2.1.0 @vitest/coverage-v8@^2.1.0 \
  @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.0 \
  @testing-library/user-event@^14.5.2 jsdom@^25.0.0 \
  vitest-mock-extended@^2.0.2 @playwright/test@^1.50.0
```

Expected: `added N packages in Xs` xato yo'q.

- [ ] **Step 2: npm script'lar qo'shish**

`package.json` ichida `"scripts": { ... }` bo'limiga qo'shing (mavjud script'lardan keyin):

```json
"test": "vitest",
"test:run": "vitest run",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage",
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

- [ ] **Step 3: .gitignore yangilash**

`.gitignore` ni o'qing va quyidagi qatorlar mavjud emasligini tekshiring. Yo'q bo'lsa, oxiriga qo'shing:

```
# Test artifacts
coverage/
playwright-report/
test-results/
.vitest-cache/
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: test freymvorklari o'rnatildi (Vitest + Playwright)"
```

---

### Task 2: Vitest konfiguratsiyasi

**Files:**
- Create: `vitest.config.ts`
- Create: `test/setup.ts`

- [ ] **Step 1: Yaratish `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'
import react from '@vitejs/plugin-react'

// Next.js 16 React 19 uchun jsdom muhiti; alias @/* tsconfig bilan sinxron
export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/analitika.ts',
        'src/app/api/sotuvlar/**/*.ts',
        'src/app/(dashboard)/sotuvlar/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__mocks__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

> **Eslatma:** `@vitejs/plugin-react` keraksiz (Vitest 2.x jsdom + globals bilan JSX ni o'qiydi); plugin'ni qo'shmang. Agar React transforms bilan muammo bo'lsa, qo'shish mumkin: `npm i -D @vitejs/plugin-react` va `plugins: [react()]`. Hozircha oddiy holatda qoldiring.

- [ ] **Step 2: Yaratish `test/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Har testdan keyin DOM ni tozalash
afterEach(() => {
  cleanup()
})

// NextAuth session mock (ko'pchilik test'larda foydalidir)
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@test.uz',
      rol: 'ADMIN',
    },
  })),
}))

// matchMedia (jsdom'da yo'q, ba'zi komponentlar uchun kerak)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// IntersectionObserver (jsdom'da yo'q, Radix UI uchun kerak)
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds = []
}
// @ts-expect-error jsdom polyfill
window.IntersectionObserver = MockIntersectionObserver

// ResizeObserver (jsdom'da yo'q, Recharts uchun kerak)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error jsdom polyfill
window.ResizeObserver = MockResizeObserver
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts test/setup.ts
git commit -m "chore: vitest konfiguratsiyasi va global setup"
```

---

### Task 3: Prisma va session mock'lari

**Files:**
- Create: `test/mocks/prisma.ts`
- Create: `test/mocks/session.ts`

- [ ] **Step 1: Yaratish `test/mocks/prisma.ts`**

```typescript
import { beforeEach, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

// Prisma singleton'ni deep mock bilan almashtirish
vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}))

// prismaMock importi test fayllarida ishlatiladi
import { prisma } from '@/lib/prisma'
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})
```

- [ ] **Step 2: Yaratish `test/mocks/session.ts`**

```typescript
import { vi } from 'vitest'

export type TestRol = 'ADMIN' | 'KASSIR' | 'OMBORCHI' | 'SOTUVCHI'

export function setSession(rol: TestRol = 'ADMIN', id = 'test-user-id') {
  const mod = vi.mocked(await import('@/lib/auth'))
  mod.auth.mockResolvedValue({
    user: { id, name: 'Test User', email: 'test@test.uz', rol },
  } as any)
}

export function clearSession() {
  const mod = vi.mocked(await import('@/lib/auth'))
  mod.auth.mockResolvedValue(null as any)
}
```

> **Muhim:** Yuqoridagi fayl top-level `await` ishlatmaydi — bu yordamchi funksiyalar chaqirilganda `import` qiladi. Agar Vitest top-level await'ni qo'llab-quvvatlamasa, static importga o'ting:

`test/mocks/session.ts` (alternativ, static import):
```typescript
import { vi } from 'vitest'
import * as authModule from '@/lib/auth'

export type TestRol = 'ADMIN' | 'KASSIR' | 'OMBORCHI' | 'SOTUVCHI'

export function setSession(rol: TestRol = 'ADMIN', id = 'test-user-id') {
  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id, name: 'Test User', email: 'test@test.uz', rol },
  } as any)
}

export function clearSession() {
  vi.mocked(authModule.auth).mockResolvedValue(null as any)
}
```

Static importni ishlating (ikkinchi blok).

- [ ] **Step 3: Commit**

```bash
git add test/mocks/prisma.ts test/mocks/session.ts
git commit -m "chore: test uchun Prisma va session mock'lari"
```

---

### Task 4: Smoke test (infra ishlayotganini tasdiqlash)

**Files:**
- Create: `test/unit/sanity.test.ts`

- [ ] **Step 1: Smoke test yozish**

```typescript
import { describe, it, expect } from 'vitest'

describe('Test infrastructure sanity', () => {
  it('matematik ishlaydi', () => {
    expect(2 + 2).toBe(4)
  })

  it('TypeScript strict type checking ishlaydi', () => {
    const x: number = 5
    expect(typeof x).toBe('number')
  })

  it('jest-dom matchers yuklangan', () => {
    const div = document.createElement('div')
    div.textContent = 'salom'
    expect(div).toHaveTextContent('salom')
  })
})
```

- [ ] **Step 2: Ishga tushirish va tasdiqlash**

Run: `npm run test:run`
Expected:
```
✓ test/unit/sanity.test.ts (3)
Test Files  1 passed (1)
     Tests  3 passed (3)
```

- [ ] **Step 3: Commit**

```bash
git add test/unit/sanity.test.ts
git commit -m "test: smoke test \u2014 infra sanity tasdiqlandi"
```

---

### Task 5: Playwright konfiguratsiyasi

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Playwright browser o'rnatish**

Run: `npx playwright install --with-deps chromium`
Expected: Chromium browser yuklanadi.

- [ ] **Step 2: Yaratish `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Yaratish `e2e/.gitkeep`** (bo'sh jildga commit uchun)

```bash
mkdir -p e2e
touch e2e/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/.gitkeep
git commit -m "chore: Playwright E2E konfiguratsiyasi"
```

---

### Task 6: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Yaratish CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npx tsc --noEmit

  test:
    name: Unit & Integration tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Build Next.js
        run: npm run build
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NEXTAUTH_SECRET: test-secret
      - name: Run E2E
        run: npm run e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          NEXTAUTH_SECRET: test-secret
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

> **Eslatma:** E2E job uchun real DB kerak — Postgres service konteyner CI da ko'tariladi. Prisma migrate deploy qo'shilishi kerak bo'lishi mumkin — E2E task bosqichida aniqlaymiz.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions \u2014 lint + test + e2e pipeline"
```

---

## FAZA 2: BACKEND

### Task 7: Analitika matematika moduli (pure functions, TDD)

**Files:**
- Create: `src/lib/analitika.ts`
- Create: `test/unit/analitika-math.test.ts`

- [ ] **Step 1: Test yozish (avval fail qiladi)**

`test/unit/analitika-math.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  hisoblaFoiz,
  hisoblaOrtachaChek,
  oldingiDavrOlish,
  soatTaqsimoti,
} from '@/lib/analitika'

describe('hisoblaFoiz', () => {
  it("yangi > eski -> ijobiy foiz qaytaradi", () => {
    expect(hisoblaFoiz(120, 100)).toBe(20)
  })

  it("yangi < eski -> salbiy foiz qaytaradi", () => {
    expect(hisoblaFoiz(80, 100)).toBe(-20)
  })

  it('eski = 0 -> null qaytaradi (noaniq)', () => {
    expect(hisoblaFoiz(100, 0)).toBeNull()
  })

  it('yangi = eski -> 0 qaytaradi', () => {
    expect(hisoblaFoiz(100, 100)).toBe(0)
  })

  it('ikki kasrli yumaloqlash', () => {
    expect(hisoblaFoiz(103, 100)).toBe(3)
    expect(hisoblaFoiz(103.5, 100)).toBe(3.5)
  })
})

describe('hisoblaOrtachaChek', () => {
  it("jami / soni to'g'ri hisoblanadi", () => {
    expect(hisoblaOrtachaChek(1000, 5)).toBe(200)
  })

  it('soni = 0 -> 0 qaytaradi (nol bo\'luvidan saqlash)', () => {
    expect(hisoblaOrtachaChek(1000, 0)).toBe(0)
  })

  it('jami = 0 -> 0 qaytaradi', () => {
    expect(hisoblaOrtachaChek(0, 5)).toBe(0)
  })
})

describe('oldingiDavrOlish', () => {
  it('16 kunlik davr uchun oldingi 16 kunni qaytaradi', () => {
    const dan = new Date('2026-04-01T00:00:00')
    const gacha = new Date('2026-04-16T23:59:59')
    const natija = oldingiDavrOlish(dan, gacha)
    expect(natija.dan.toISOString().slice(0, 10)).toBe('2026-03-16')
    expect(natija.gacha.toISOString().slice(0, 10)).toBe('2026-03-31')
  })

  it('1 kunlik davr uchun oldingi kunni qaytaradi', () => {
    const dan = new Date('2026-04-16T00:00:00')
    const gacha = new Date('2026-04-16T23:59:59')
    const natija = oldingiDavrOlish(dan, gacha)
    expect(natija.dan.toISOString().slice(0, 10)).toBe('2026-04-15')
    expect(natija.gacha.toISOString().slice(0, 10)).toBe('2026-04-15')
  })
})

describe('soatTaqsimoti', () => {
  it("24 ta soat qaytaradi (0-23)", () => {
    const natija = soatTaqsimoti([])
    expect(natija).toHaveLength(24)
    expect(natija[0].soat).toBe(0)
    expect(natija[23].soat).toBe(23)
  })

  it("sotuvlarni soat bo'yicha to'g'ri guruhlaydi", () => {
    const sotuvlar = [
      { sana: new Date('2026-04-16T09:30:00'), yakuniySumma: 100 },
      { sana: new Date('2026-04-16T09:45:00'), yakuniySumma: 200 },
      { sana: new Date('2026-04-16T14:00:00'), yakuniySumma: 500 },
    ]
    const natija = soatTaqsimoti(sotuvlar)
    expect(natija[9].sotuvSoni).toBe(2)
    expect(natija[9].jami).toBe(300)
    expect(natija[14].sotuvSoni).toBe(1)
    expect(natija[14].jami).toBe(500)
    expect(natija[0].sotuvSoni).toBe(0)
  })
})
```

- [ ] **Step 2: Testni ishga tushirish — FAIL kutiladi**

Run: `npm run test:run -- test/unit/analitika-math.test.ts`
Expected: `FAIL` — `Failed to resolve import "@/lib/analitika"`.

- [ ] **Step 3: Minimal implementatsiya**

`src/lib/analitika.ts`:

```typescript
/** Ikki davr orasidagi foizli o'zgarish. Eski = 0 bo'lsa null. */
export function hisoblaFoiz(yangi: number, eski: number): number | null {
  if (eski === 0) return null
  const foiz = ((yangi - eski) / eski) * 100
  return Math.round(foiz * 10) / 10
}

/** O'rtacha chek summasi. Soni = 0 bo'lsa 0. */
export function hisoblaOrtachaChek(jami: number, soni: number): number {
  if (soni === 0) return 0
  return jami / soni
}

/** Joriy davrga teng uzunlikdagi oldingi davr. */
export function oldingiDavrOlish(dan: Date, gacha: Date): { dan: Date; gacha: Date } {
  const kunlar = Math.floor((gacha.getTime() - dan.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const oldingiGacha = new Date(dan)
  oldingiGacha.setDate(oldingiGacha.getDate() - 1)
  oldingiGacha.setHours(23, 59, 59, 999)
  const oldingiDan = new Date(oldingiGacha)
  oldingiDan.setDate(oldingiDan.getDate() - (kunlar - 1))
  oldingiDan.setHours(0, 0, 0, 0)
  return { dan: oldingiDan, gacha: oldingiGacha }
}

/** Sotuvlarni 0-23 soatga guruhlash. */
export function soatTaqsimoti(
  sotuvlar: Array<{ sana: Date; yakuniySumma: number }>
): Array<{ soat: number; sotuvSoni: number; jami: number }> {
  const natija = Array.from({ length: 24 }, (_, soat) => ({
    soat,
    sotuvSoni: 0,
    jami: 0,
  }))
  for (const s of sotuvlar) {
    const h = s.sana.getHours()
    natija[h].sotuvSoni += 1
    natija[h].jami += s.yakuniySumma
  }
  return natija
}
```

- [ ] **Step 4: Test qayta ishga tushirish — PASS kutiladi**

Run: `npm run test:run -- test/unit/analitika-math.test.ts`
Expected:
```
✓ test/unit/analitika-math.test.ts (11)
Tests  11 passed (11)
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: Xato yo'q.

- [ ] **Step 6: Commit**

```bash
git add src/lib/analitika.ts test/unit/analitika-math.test.ts
git commit -m "feat(lib): analitika matematika funksiyalari (foiz, o'rtacha chek, oldingi davr, soat taqsimoti)"
```

---

### Task 8: `/api/sotuvlar/analitika` endpoint (TDD)

**Files:**
- Create: `src/app/api/sotuvlar/analitika/route.ts`
- Create: `test/integration/api-sotuvlar-analitika.test.ts`

- [ ] **Step 1: Integration test yozish**

`test/integration/api-sotuvlar-analitika.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession, clearSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/analitika/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar/analitika')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
})

describe('GET /api/sotuvlar/analitika', () => {
  it('auth yo\'q -> 401', async () => {
    clearSession()
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("bo'sh davr -> 0 qiymatlar", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([])
    prismaMock.sotuv.count.mockResolvedValue(0)
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.jamiSotuv).toBe(0)
    expect(body.sotuvSoni).toBe(0)
    expect(body.ortachaChek).toBe(0)
    expect(body.jamiFoyda).toBe(0)
    expect(body.kassirlar).toEqual([])
    expect(body.mijozlar).toEqual([])
  })

  it("SHERIK to'lov usuli jamiSotuv'ga kirmaydi", async () => {
    prismaMock.sotuv.findMany.mockImplementation(async (args: any) => {
      // Filter argumentida tolovUsuli not: SHERIK borligini tekshirish
      if (args?.where?.tolovUsuli?.not === 'SHERIK') {
        return [
          { id: '1', yakuniySumma: 500, sana: new Date('2026-04-10'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [] } as any,
        ]
      }
      return [] as any
    })
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(body.jamiSotuv).toBe(500)
  })

  it("BEKOR_QILINGAN sotuvlar chiqariladi", async () => {
    // Mock bir sotuv YAKUNLANGAN, boshqasi BEKOR_QILINGAN — faqat YAKUNLANGAN kiradi
    prismaMock.sotuv.findMany.mockImplementation(async (args: any) => {
      expect(args?.where?.holati).toBe('YAKUNLANGAN')
      return [] as any
    })
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
  })

  it("default davr = shu oy 1-kunidan bugungacha", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)

    const res = await GET(makeRequest()) // hech qanday dan/gacha yo'q
    expect(res.status).toBe(200)
    // Handler ichki defaults yaratadi — xato tashlamasligini tekshirish yetarli
  })

  it("oldingiDavr juft fetch qilinadi (joriy davrga teng uzunlik)", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)

    await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    // findMany kamida 2 marta chaqiriladi (joriy + oldingi)
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledTimes(2)
  })

  it("kassirlar breakdown to'g'ri aggregation qiladi", async () => {
    prismaMock.sotuv.findMany.mockImplementation(async (args: any) => {
      // Faqat joriy davr (oldingi davr bo'sh)
      if (args?.where?.sana?.gte && args.where.sana.gte.getFullYear() === 2026 && args.where.sana.gte.getMonth() === 3) {
        return [
          { id: '1', yakuniySumma: 500, sana: new Date('2026-04-10'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [], kassir: { id: 'k1', ism: 'Aziz' } } as any,
          { id: '2', yakuniySumma: 300, sana: new Date('2026-04-11'), kassirId: 'k1', mijozId: null, tolovUsuli: 'NAQD', tarkiblar: [], kassir: { id: 'k1', ism: 'Aziz' } } as any,
          { id: '3', yakuniySumma: 700, sana: new Date('2026-04-12'), kassirId: 'k2', mijozId: null, tolovUsuli: 'KARTA', tarkiblar: [], kassir: { id: 'k2', ism: 'Bekzod' } } as any,
        ] as any
      }
      return [] as any
    })
    prismaMock.qaytarish.aggregate.mockResolvedValue({ _sum: { jamiSumma: null } } as any)
    prismaMock.sotuvTarkibi.groupBy.mockResolvedValue([] as any)
    prismaMock.qaytarish.findMany?.mockResolvedValue?.([] as any)

    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const body = await res.json()

    expect(body.kassirlar).toHaveLength(2)
    const aziz = body.kassirlar.find((k: any) => k.ism === 'Aziz')
    expect(aziz.sotuvSoni).toBe(2)
    expect(aziz.jami).toBe(800)
    const bekzod = body.kassirlar.find((k: any) => k.ism === 'Bekzod')
    expect(bekzod.sotuvSoni).toBe(1)
    expect(bekzod.jami).toBe(700)
  })
})
```

- [ ] **Step 2: Testni ishga tushirish — FAIL kutiladi**

Run: `npm run test:run -- test/integration/api-sotuvlar-analitika.test.ts`
Expected: `FAIL` — module'ni hal qilib bo'lmaydi.

- [ ] **Step 3: Endpoint yaratish**

`src/app/api/sotuvlar/analitika/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hisoblaOrtachaChek, oldingiDavrOlish, soatTaqsimoti } from '@/lib/analitika'
import type { TolovUsuli } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const dan = searchParams.get('dan')
    const gacha = searchParams.get('gacha')
    const kassirId = searchParams.get('kassirId') || undefined
    const mijozId = searchParams.get('mijozId') || undefined
    const tolovUsuli = (searchParams.get('tolovUsuli') as TolovUsuli | null) || undefined

    const bugun = new Date()
    bugun.setHours(23, 59, 59, 999)
    const oyBoshi = new Date(bugun)
    oyBoshi.setDate(1)
    oyBoshi.setHours(0, 0, 0, 0)

    const danSana = dan ? new Date(dan) : oyBoshi
    const gachaSana = gacha ? new Date(gacha) : bugun
    if (gacha && gachaSana.getHours() === 0) gachaSana.setHours(23, 59, 59, 999)

    const { dan: oldDan, gacha: oldGacha } = oldingiDavrOlish(danSana, gachaSana)

    // Asosiy where: yakunlangan, SHERIK to'lov usuli chiqariladi
    const joriySotuvWhere = {
      holati: 'YAKUNLANGAN' as const,
      sana: { gte: danSana, lte: gachaSana },
      tolovUsuli: tolovUsuli ?? { not: 'SHERIK' as const },
      ...(kassirId ? { kassirId } : {}),
      ...(mijozId ? { mijozId } : {}),
    }
    const oldingiSotuvWhere = {
      ...joriySotuvWhere,
      sana: { gte: oldDan, lte: oldGacha },
    }

    // Parallel fetch: joriy, oldingi, qaytarishlar
    const [joriySotuvlar, oldingiSotuvlar, qaytarishSum, topTarkiblar] = await Promise.all([
      prisma.sotuv.findMany({
        where: joriySotuvWhere,
        include: {
          tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true, kelishNarxi: true } } } },
          kassir: { select: { id: true, ism: true } },
          mijoz: { select: { id: true, ism: true, telefon: true } },
        },
      }),
      prisma.sotuv.findMany({
        where: oldingiSotuvWhere,
        include: {
          tarkiblar: { include: { tovar: { select: { kelishNarxi: true } } } },
        },
      }),
      prisma.qaytarish.aggregate({
        where: { yaratilgan: { gte: danSana, lte: gachaSana } },
        _sum: { jamiSumma: true },
      }),
      prisma.sotuvTarkibi.groupBy({
        by: ['tovarId'],
        _sum: { miqdor: true, jami: true },
        where: { sotuv: joriySotuvWhere },
        orderBy: { _sum: { jami: 'desc' } },
        take: 20,
      }),
    ])

    const jamiQaytarish = Number(qaytarishSum._sum.jamiSumma || 0)

    // Foyda: har SotuvTarkibi uchun (birlikNarxi - kelishNarxi) * miqdor
    const hisoblaFoyda = (sotuvlar: typeof joriySotuvlar) =>
      sotuvlar.reduce((jami, s) => {
        const sotuvFoyda = s.tarkiblar.reduce(
          (f, t) => f + (Number(t.birlikNarxi) - Number(t.tovar.kelishNarxi)) * Number(t.miqdor),
          0
        )
        return jami + sotuvFoyda
      }, 0)

    const jamiSotuv = joriySotuvlar.reduce((s, v) => s + Number(v.yakuniySumma), 0) - jamiQaytarish
    const jamiFoyda = hisoblaFoyda(joriySotuvlar)
    const jamiChegirma = joriySotuvlar.reduce((s, v) => s + Number(v.chegirma), 0)
    const sotuvSoni = joriySotuvlar.length
    const ortachaChek = hisoblaOrtachaChek(jamiSotuv, sotuvSoni)

    const oldingiJami = oldingiSotuvlar.reduce((s, v) => s + Number(v.yakuniySumma), 0)
    const oldingiFoyda = hisoblaFoyda(oldingiSotuvlar as any)
    const oldingiSoni = oldingiSotuvlar.length

    // Kunlik grafik — davr kunlari bo'yicha
    const kunlikMap = new Map<string, { sotuv: number; sotuvSoni: number; oldingiSotuv: number }>()
    const kunFormatlash = (d: Date) => d.toISOString().slice(0, 10)

    for (let d = new Date(danSana); d <= gachaSana; d.setDate(d.getDate() + 1)) {
      kunlikMap.set(kunFormatlash(d), { sotuv: 0, sotuvSoni: 0, oldingiSotuv: 0 })
    }
    for (const s of joriySotuvlar) {
      const k = kunFormatlash(s.sana)
      const bor = kunlikMap.get(k)
      if (bor) {
        bor.sotuv += Number(s.yakuniySumma)
        bor.sotuvSoni += 1
      }
    }
    // Oldingi davrning har kunini joriy davrning tegishli kuniga solishtirish
    const kunlar = Math.ceil((gachaSana.getTime() - danSana.getTime()) / (1000 * 60 * 60 * 24)) + 1
    for (const s of oldingiSotuvlar) {
      const offset = Math.floor((s.sana.getTime() - oldDan.getTime()) / (1000 * 60 * 60 * 24))
      const joriyKun = new Date(danSana)
      joriyKun.setDate(joriyKun.getDate() + offset)
      const k = kunFormatlash(joriyKun)
      const bor = kunlikMap.get(k)
      if (bor) bor.oldingiSotuv += Number(s.yakuniySumma)
    }
    const kunlikGrafik = Array.from(kunlikMap.entries()).map(([sana, d]) => ({ sana, ...d }))

    // Kassirlar bo'yicha
    const kassirMap = new Map<string, { kassirId: string; ism: string; sotuvSoni: number; jami: number; foyda: number; qaytarishlarSoni: number }>()
    for (const s of joriySotuvlar) {
      const key = s.kassirId
      const bor = kassirMap.get(key) ?? {
        kassirId: key,
        ism: s.kassir.ism,
        sotuvSoni: 0,
        jami: 0,
        foyda: 0,
        qaytarishlarSoni: 0,
      }
      bor.sotuvSoni += 1
      bor.jami += Number(s.yakuniySumma)
      bor.foyda += s.tarkiblar.reduce(
        (f, t) => f + (Number(t.birlikNarxi) - Number(t.tovar.kelishNarxi)) * Number(t.miqdor),
        0
      )
      kassirMap.set(key, bor)
    }
    const kassirlar = Array.from(kassirMap.values())
      .map((k) => ({ ...k, ortachaChek: hisoblaOrtachaChek(k.jami, k.sotuvSoni) }))
      .sort((a, b) => b.jami - a.jami)

    // Qaytarishlar sonini kassirlar bo'yicha qo'shish
    const qaytarishlar = await prisma.qaytarish.groupBy({
      by: ['kassirId'],
      _count: true,
      where: { yaratilgan: { gte: danSana, lte: gachaSana } },
    })
    for (const q of qaytarishlar) {
      const k = kassirlar.find((x) => x.kassirId === q.kassirId)
      if (k) k.qaytarishlarSoni = q._count as number
    }

    // Mijozlar bo'yicha (top 20)
    const mijozMap = new Map<string, { mijozId: string; ism: string; telefon: string | null; sotuvSoni: number; jami: number; nasiyaQoldiq: number }>()
    for (const s of joriySotuvlar) {
      if (!s.mijozId || !s.mijoz) continue
      const key = s.mijozId
      const bor = mijozMap.get(key) ?? {
        mijozId: key,
        ism: s.mijoz.ism,
        telefon: s.mijoz.telefon ?? null,
        sotuvSoni: 0,
        jami: 0,
        nasiyaQoldiq: 0,
      }
      bor.sotuvSoni += 1
      bor.jami += Number(s.yakuniySumma)
      mijozMap.set(key, bor)
    }
    // Nasiya qoldiqlarini qo'shish
    const mijozIdlar = Array.from(mijozMap.keys())
    if (mijozIdlar.length > 0) {
      const nasiyaQoldiqlar = await prisma.nasiya.groupBy({
        by: ['mijozId'],
        _sum: { qoldiq: true },
        where: { mijozId: { in: mijozIdlar }, holati: { in: ['OCHIQ', 'MUDDATI_OTGAN'] } },
      })
      for (const n of nasiyaQoldiqlar) {
        const m = mijozMap.get(n.mijozId)
        if (m) m.nasiyaQoldiq = Number(n._sum.qoldiq ?? 0)
      }
    }
    const mijozlar = Array.from(mijozMap.values())
      .sort((a, b) => b.jami - a.jami)
      .slice(0, 20)

    // To'lov usullari bo'yicha
    const tolovMap = new Map<TolovUsuli, { sotuvSoni: number; jami: number }>()
    for (const s of joriySotuvlar) {
      const bor = tolovMap.get(s.tolovUsuli) ?? { sotuvSoni: 0, jami: 0 }
      bor.sotuvSoni += 1
      bor.jami += Number(s.yakuniySumma)
      tolovMap.set(s.tolovUsuli, bor)
    }
    const tolovJami = Array.from(tolovMap.values()).reduce((s, v) => s + v.jami, 0) || 1
    const tolovUsullari = Array.from(tolovMap.entries())
      .map(([tolovUsuli, d]) => ({ tolovUsuli, ...d, ulush: Math.round((d.jami / tolovJami) * 1000) / 10 }))
      .sort((a, b) => b.jami - a.jami)

    // Top tovarlar (top 20) — tovar ma'lumotini qo'shish
    const tovarIds = topTarkiblar.map((t) => t.tovarId)
    const tovarlar = await prisma.tovar.findMany({
      where: { id: { in: tovarIds } },
      select: { id: true, nomi: true, birlik: true, kelishNarxi: true },
    })
    const topTovarlar = topTarkiblar.map((t) => {
      const tov = tovarlar.find((tv) => tv.id === t.tovarId)
      const miqdor = Number(t._sum.miqdor ?? 0)
      const jami = Number(t._sum.jami ?? 0)
      const kelishJami = miqdor * Number(tov?.kelishNarxi ?? 0)
      return {
        tovarId: t.tovarId,
        nomi: tov?.nomi ?? 'Noma\'lum',
        birlik: tov?.birlik ?? 'DONA',
        miqdor,
        jami,
        foyda: jami - kelishJami,
      }
    })

    // Soat taqsimoti
    const soatlar = soatTaqsimoti(
      joriySotuvlar.map((s) => ({ sana: s.sana, yakuniySumma: Number(s.yakuniySumma) }))
    )

    return NextResponse.json({
      jamiSotuv,
      jamiQaytarish,
      sotuvSoni,
      ortachaChek,
      jamiFoyda,
      jamiChegirma,
      oldingiDavr: {
        jamiSotuv: oldingiJami,
        sotuvSoni: oldingiSoni,
        ortachaChek: hisoblaOrtachaChek(oldingiJami, oldingiSoni),
        jamiFoyda: oldingiFoyda,
      },
      kunlikGrafik,
      kassirlar,
      mijozlar,
      tolovUsullari,
      topTovarlar,
      soatlar,
    })
  } catch (e) {
    console.error('[/api/sotuvlar/analitika]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Testni qayta ishga tushirish — PASS kutiladi**

Run: `npm run test:run -- test/integration/api-sotuvlar-analitika.test.ts`
Expected: Barcha testlar o'tadi.

> **Eslatma:** Agar test bir nechta `qaytarish.groupBy` mock'ini kutayotganiga oid xato bersa, mock fayl ichida `prismaMock.qaytarish.groupBy.mockResolvedValue([])` qo'shing va `prismaMock.nasiya.groupBy.mockResolvedValue([])` ham qo'shing.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Xato yo'q.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sotuvlar/analitika/route.ts test/integration/api-sotuvlar-analitika.test.ts
git commit -m "feat(api): sotuvlar analitika endpoint (hero metric, breakdowns, oldingi davr taqqoslash)"
```

---

### Task 9: `/api/sotuvlar` filter kengaytirish (TDD)

**Files:**
- Modify: `src/app/api/sotuvlar/route.ts`
- Create: `test/integration/api-sotuvlar-filter.test.ts`

- [ ] **Step 1: Yangi test'lar yozish**

`test/integration/api-sotuvlar-filter.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
  prismaMock.sotuv.findMany.mockResolvedValue([] as any)
  prismaMock.sotuv.count.mockResolvedValue(0)
})

describe('GET /api/sotuvlar \u2014 kengaytirilgan filter\'lar', () => {
  it('kassirId filter where shartiga qo\'shiladi', async () => {
    await GET(makeRequest({ kassirId: 'k1' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ kassirId: 'k1' }) })
    )
  })

  it('mijozId filter where shartiga qo\'shiladi', async () => {
    await GET(makeRequest({ mijozId: 'm1' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ mijozId: 'm1' }) })
    )
  })

  it("tolovUsuli filter where shartiga qo'shiladi", async () => {
    await GET(makeRequest({ tolovUsuli: 'NAQD' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tolovUsuli: 'NAQD' }) })
    )
  })

  it("q parametri chekRaqami yoki mijoz.ism bo'yicha OR qidiruv", async () => {
    await GET(makeRequest({ q: 'test' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ chekRaqami: expect.objectContaining({ contains: 'test' }) }),
            expect.objectContaining({ mijoz: expect.objectContaining({ ism: expect.any(Object) }) }),
          ]),
        }),
      })
    )
  })

  it("sort va order parametrlari orderBy ga o'tkaziladi", async () => {
    await GET(makeRequest({ sort: 'yakuniySumma', order: 'asc' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { yakuniySumma: 'asc' } })
    )
  })

  it("noma'lum sort qiymati -> default sana desc", async () => {
    await GET(makeRequest({ sort: 'mavhum-ustun' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { sana: 'desc' } })
    )
  })

  it("mavjud dan/gacha filter saqlanadi", async () => {
    await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(prismaMock.sotuv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sana: expect.any(Object) }),
      })
    )
  })
})
```

- [ ] **Step 2: Test ishga tushirish — FAIL kutiladi**

Run: `npm run test:run -- test/integration/api-sotuvlar-filter.test.ts`
Expected: Bir nechta test fail (`kassirId` filter qo'shilmagan, va h.k.).

- [ ] **Step 3: `src/app/api/sotuvlar/route.ts` ni yangilash**

Mavjud `GET` funksiyasini topib, query parsing va `where` qurishni kengaytiring. Quyidagi block `const { searchParams } = new URL(req.url)` dan keyin joylashtiriladi:

```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '20')
const dan = searchParams.get('dan')
const gacha = searchParams.get('gacha')
const chekRaqami = searchParams.get('chekRaqami')
const kassirId = searchParams.get('kassirId')
const mijozId = searchParams.get('mijozId')
const tolovUsuli = searchParams.get('tolovUsuli') as 'NAQD' | 'KARTA' | 'ARALASH' | 'NASIYA' | 'SHERIK' | null
const q = searchParams.get('q')
const sort = searchParams.get('sort')
const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

// chekRaqami bo'yicha qidirish yo'li (qaytarish uchun) \u2014 mavjud qoladi
if (chekRaqami) {
  // ... mavjud logika
}

const where: any = {}
if (dan || gacha) {
  where.sana = {}
  if (dan) where.sana.gte = new Date(dan)
  if (gacha) {
    const gachaD = new Date(gacha)
    gachaD.setHours(23, 59, 59)
    where.sana.lte = gachaD
  }
}
if (kassirId) where.kassirId = kassirId
if (mijozId) where.mijozId = mijozId
if (tolovUsuli) where.tolovUsuli = tolovUsuli
if (q) {
  where.OR = [
    { chekRaqami: { contains: q, mode: 'insensitive' } },
    { mijoz: { ism: { contains: q, mode: 'insensitive' } } },
    { mijoz: { telefon: { contains: q } } },
  ]
}

const allowedSort = ['sana', 'yakuniySumma', 'chekRaqami']
const sortField = allowedSort.includes(sort || '') ? sort! : 'sana'
const orderBy = { [sortField]: order } as Record<string, 'asc' | 'desc'>
```

So'ngra `prisma.sotuv.findMany` chaqiruvida `orderBy: { sana: 'desc' }` ni `orderBy` o'zgaruvchisi bilan almashtiring.

**To'liq yangilangan funksiya parchasi (referens):**

```typescript
// ... (session, searchParams kengaytirish yuqorida)

const [sotuvlar, jami] = await Promise.all([
  prisma.sotuv.findMany({
    where,
    include: {
      mijoz: { select: { ism: true, telefon: true } },
      kassir: { select: { ism: true } },
      sherikDokon: { select: { nomi: true } },
      tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true } } } },
      nasiya: true,
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.sotuv.count({ where }),
])

return NextResponse.json({ sotuvlar, jami, page, limit })
```

- [ ] **Step 4: Test qayta ishga tushirish — PASS**

Run: `npm run test:run -- test/integration/api-sotuvlar-filter.test.ts`
Expected: Barcha testlar yashil.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sotuvlar/route.ts test/integration/api-sotuvlar-filter.test.ts
git commit -m "feat(api): /api/sotuvlar filter kengaytmasi (kassir, mijoz, to'lov, qidiruv, sort)"
```

---

### Task 10: `/api/sotuvlar/export` Excel endpoint (TDD)

**Files:**
- Create: `src/app/api/sotuvlar/export/route.ts`
- Create: `test/integration/api-sotuvlar-export.test.ts`

- [ ] **Step 1: Test yozish**

`test/integration/api-sotuvlar-export.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import '@/../test/mocks/prisma'
import { prismaMock } from '@/../test/mocks/prisma'
import { setSession, clearSession } from '@/../test/mocks/session'
import { GET } from '@/app/api/sotuvlar/export/route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/sotuvlar/export')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url)
}

beforeEach(() => {
  setSession('ADMIN')
})

describe('GET /api/sotuvlar/export', () => {
  it("auth yo'q -> 401", async () => {
    clearSession()
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("Content-Type Excel MIME turi bo'ladi", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('spreadsheetml.sheet')
  })

  it("Content-Disposition attachment + .xlsx kengaytma", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    const disposition = res.headers.get('Content-Disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toMatch(/\.xlsx/)
  })

  it("bo'sh natija ham muvaffaqiyatli qaytadi (bo'sh jadvallar bilan)", async () => {
    prismaMock.sotuv.findMany.mockResolvedValue([] as any)
    const res = await GET(makeRequest({ dan: '2026-04-01', gacha: '2026-04-16' }))
    expect(res.status).toBe(200)
    const buffer = await res.arrayBuffer()
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Test ishga tushirish — FAIL**

Run: `npm run test:run -- test/integration/api-sotuvlar-export.test.ts`
Expected: FAIL — module topilmadi.

- [ ] **Step 3: Endpoint yaratish**

`src/app/api/sotuvlar/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const dan = searchParams.get('dan')
    const gacha = searchParams.get('gacha')
    const kassirId = searchParams.get('kassirId') || undefined
    const mijozId = searchParams.get('mijozId') || undefined
    const tolovUsuli = searchParams.get('tolovUsuli') || undefined

    const where: any = { holati: 'YAKUNLANGAN' }
    if (dan || gacha) {
      where.sana = {}
      if (dan) where.sana.gte = new Date(dan)
      if (gacha) {
        const g = new Date(gacha)
        g.setHours(23, 59, 59)
        where.sana.lte = g
      }
    }
    if (kassirId) where.kassirId = kassirId
    if (mijozId) where.mijozId = mijozId
    if (tolovUsuli) where.tolovUsuli = tolovUsuli

    const sotuvlar = await prisma.sotuv.findMany({
      where,
      include: {
        kassir: { select: { ism: true } },
        mijoz: { select: { ism: true, telefon: true } },
        tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true, kelishNarxi: true } } } },
      },
      orderBy: { sana: 'desc' },
    })

    // Sheet 1: Sotuvlar
    const sotuvlarRows = sotuvlar.map((s) => {
      const foyda = s.tarkiblar.reduce(
        (f, t) => f + (Number(t.birlikNarxi) - Number(t.tovar.kelishNarxi)) * Number(t.miqdor),
        0
      )
      return {
        Sana: s.sana.toISOString().replace('T', ' ').slice(0, 19),
        'Chek #': s.chekRaqami,
        Kassir: s.kassir.ism,
        Mijoz: s.mijoz?.ism ?? '\u2014',
        Telefon: s.mijoz?.telefon ?? '',
        "To'lov usuli": s.tolovUsuli,
        Summa: Number(s.jamiSumma),
        Chegirma: Number(s.chegirma),
        Yakuniy: Number(s.yakuniySumma),
        Foyda: foyda,
        Holati: s.holati,
      }
    })

    // Sheet 2: Tarkiblar
    const tarkiblarRows = sotuvlar.flatMap((s) =>
      s.tarkiblar.map((t) => ({
        'Chek #': s.chekRaqami,
        Tovar: t.tovar.nomi,
        Birlik: t.tovar.birlik,
        Miqdor: Number(t.miqdor),
        Narx: Number(t.birlikNarxi),
        Chegirma: Number(t.chegirma),
        Jami: Number(t.jami),
      }))
    )

    // Sheet 3: Xulosa
    const kassirMap = new Map<string, { ism: string; soni: number; jami: number }>()
    const tolovMap = new Map<string, { soni: number; jami: number }>()
    for (const s of sotuvlar) {
      const k = kassirMap.get(s.kassir.ism) ?? { ism: s.kassir.ism, soni: 0, jami: 0 }
      k.soni += 1
      k.jami += Number(s.yakuniySumma)
      kassirMap.set(s.kassir.ism, k)

      const t = tolovMap.get(s.tolovUsuli) ?? { soni: 0, jami: 0 }
      t.soni += 1
      t.jami += Number(s.yakuniySumma)
      tolovMap.set(s.tolovUsuli, t)
    }

    const xulosaRows = [
      { "Bo'lim": 'KASSIRLAR', Nomi: '', Soni: '', Jami: '' },
      ...Array.from(kassirMap.values()).map((k) => ({
        "Bo'lim": '',
        Nomi: k.ism,
        Soni: k.soni,
        Jami: k.jami,
      })),
      { "Bo'lim": '', Nomi: '', Soni: '', Jami: '' },
      { "Bo'lim": "TO'LOV USULLARI", Nomi: '', Soni: '', Jami: '' },
      ...Array.from(tolovMap.entries()).map(([tolov, v]) => ({
        "Bo'lim": '',
        Nomi: tolov,
        Soni: v.soni,
        Jami: v.jami,
      })),
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sotuvlarRows), 'Sotuvlar')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tarkiblarRows), 'Tarkiblar')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(xulosaRows), 'Xulosa')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fileName = `sotuvlar-${dan ?? 'davr'}-${gacha ?? 'hozirgi'}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (e) {
    console.error('[/api/sotuvlar/export]', e)
    return NextResponse.json({ xato: 'Eksport muvaffaqiyatsiz' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Test qayta ishga tushirish — PASS**

Run: `npm run test:run -- test/integration/api-sotuvlar-export.test.ts`
Expected: 4 test yashil.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sotuvlar/export/route.ts test/integration/api-sotuvlar-export.test.ts
git commit -m "feat(api): Excel eksport endpoint (3 sheet: sotuvlar, tarkiblar, xulosa)"
```

---

## FAZA 3: FRONTEND — JAMOAVIY PRIMITIVELAR

### Task 11: Type'lar va URL-driven filter hook

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_types.ts`
- Create: `src/app/(dashboard)/sotuvlar/_hooks/useSotuvlarFilters.ts`

- [ ] **Step 1: Type'lar**

`src/app/(dashboard)/sotuvlar/_types.ts`:

```typescript
import type { TolovUsuli } from '@prisma/client'

export type Preset = 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy' | 'maxsus'

export type BreakdownTab = 'kassirlar' | 'mijozlar' | 'tolov' | 'tovarlar' | 'soatlar'

export interface Filtrlar {
  dan: string    // ISO YYYY-MM-DD
  gacha: string  // ISO YYYY-MM-DD
  kassirId?: string
  mijozId?: string
  tolovUsuli?: TolovUsuli
  q?: string
  sort: 'sana' | 'yakuniySumma' | 'chekRaqami'
  order: 'asc' | 'desc'
  page: number
  limit: number
}

export interface AnalitikaJavobi {
  jamiSotuv: number
  jamiQaytarish: number
  sotuvSoni: number
  ortachaChek: number
  jamiFoyda: number
  jamiChegirma: number
  oldingiDavr: {
    jamiSotuv: number
    sotuvSoni: number
    ortachaChek: number
    jamiFoyda: number
  }
  kunlikGrafik: Array<{ sana: string; sotuv: number; sotuvSoni: number; oldingiSotuv: number }>
  kassirlar: Array<{
    kassirId: string
    ism: string
    sotuvSoni: number
    jami: number
    ortachaChek: number
    foyda: number
    qaytarishlarSoni: number
  }>
  mijozlar: Array<{
    mijozId: string
    ism: string
    telefon: string | null
    sotuvSoni: number
    jami: number
    nasiyaQoldiq: number
  }>
  tolovUsullari: Array<{ tolovUsuli: TolovUsuli; sotuvSoni: number; jami: number; ulush: number }>
  topTovarlar: Array<{ tovarId: string; nomi: string; birlik: string; miqdor: number; jami: number; foyda: number }>
  soatlar: Array<{ soat: number; sotuvSoni: number; jami: number }>
}

export interface SotuvQatori {
  id: string
  chekRaqami: string
  sana: string
  yakuniySumma: number
  chegirma: number
  tolovUsuli: TolovUsuli
  holati: string
  kassir: { ism: string }
  mijoz: { ism: string; telefon: string | null } | null
  tarkiblar: Array<{ tovar: { nomi: string; birlik: string }; miqdor: number; birlikNarxi: number; jami: number }>
  nasiya: { qoldiq: number; muddat: string | null; holati: string } | null
}
```

- [ ] **Step 2: Filter hook**

`src/app/(dashboard)/sotuvlar/_hooks/useSotuvlarFilters.ts`:

```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import type { Filtrlar } from '../_types'

function oyBoshiniOlish(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function bugunOlish(): string {
  return new Date().toISOString().slice(0, 10)
}

/** URL params bilan sinxron filtrlar. Qiymat o'zgartirilganda URL yangilanadi. */
export function useSotuvlarFilters(): {
  filtrlar: Filtrlar
  yangilash: (patch: Partial<Filtrlar>) => void
  tozalash: () => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const filtrlar: Filtrlar = useMemo(
    () => ({
      dan: sp.get('dan') ?? oyBoshiniOlish(),
      gacha: sp.get('gacha') ?? bugunOlish(),
      kassirId: sp.get('kassirId') ?? undefined,
      mijozId: sp.get('mijozId') ?? undefined,
      tolovUsuli: (sp.get('tolovUsuli') as Filtrlar['tolovUsuli']) ?? undefined,
      q: sp.get('q') ?? undefined,
      sort: (sp.get('sort') as Filtrlar['sort']) ?? 'sana',
      order: (sp.get('order') as Filtrlar['order']) ?? 'desc',
      page: Math.max(1, parseInt(sp.get('page') ?? '1')),
      limit: Math.max(10, Math.min(100, parseInt(sp.get('limit') ?? '50'))),
    }),
    [sp]
  )

  const yangilash = useCallback(
    (patch: Partial<Filtrlar>) => {
      const yangi = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === '') yangi.delete(k)
        else yangi.set(k, String(v))
      }
      // Agar qidiruv/filter o'zgarsa, page=1 ga qaytarish
      if (patch.q !== undefined || patch.kassirId !== undefined || patch.mijozId !== undefined || patch.tolovUsuli !== undefined || patch.dan !== undefined || patch.gacha !== undefined) {
        yangi.set('page', '1')
      }
      router.replace(`${pathname}?${yangi.toString()}`, { scroll: false })
    },
    [router, pathname, sp]
  )

  const tozalash = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return { filtrlar, yangilash, tozalash }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: Xato yo'q.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_types.ts" "src/app/(dashboard)/sotuvlar/_hooks/useSotuvlarFilters.ts"
git commit -m "feat(sotuvlar): type'lar va URL-driven filter hook"
```

---

### Task 12: SkeletonLoaders komponent

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/SkeletonLoaders.tsx`

- [ ] **Step 1: Skeleton komponentlari**

`src/app/(dashboard)/sotuvlar/_components/SkeletonLoaders.tsx`:

```tsx
'use client'

export function HeroMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="h-10 w-56 bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="h-3 w-40 bg-gray-200 dark:bg-neutral-800 rounded mb-6" />
        <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>
      <div className="grid grid-rows-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 animate-pulse"
          >
            <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-6 w-28 bg-gray-200 dark:bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 dark:bg-neutral-800 rounded mb-4" />
      <div className="h-48 bg-gray-100 dark:bg-neutral-800 rounded" />
    </div>
  )
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-10 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/SkeletonLoaders.tsx"
git commit -m "feat(sotuvlar): skeleton loader komponentlari (hero, chart, table)"
```

---

### Task 13: DateRangePicker komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/DateRangePicker.tsx`
- Create: `test/components/DateRangePicker.test.tsx`

- [ ] **Step 1: Test yozish**

`test/components/DateRangePicker.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker } from '@/app/(dashboard)/sotuvlar/_components/DateRangePicker'

describe('DateRangePicker', () => {
  it("barcha presetlarni ko'rsatadi", () => {
    render(<DateRangePicker dan="2026-04-01" gacha="2026-04-16" onChange={() => {}} />)
    expect(screen.getByText('Bugun')).toBeInTheDocument()
    expect(screen.getByText('Kecha')).toBeInTheDocument()
    expect(screen.getByText('Oxirgi 7 kun')).toBeInTheDocument()
    expect(screen.getByText('Shu oy')).toBeInTheDocument()
    expect(screen.getByText("O'tgan oy")).toBeInTheDocument()
  })

  it('preset bosilganda onChange chaqiriladi', async () => {
    const onChange = vi.fn()
    render(<DateRangePicker dan="" gacha="" onChange={onChange} />)
    await userEvent.click(screen.getByText('Bugun'))
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0]
    expect(arg.dan).toBe(arg.gacha) // bugun = boshlanish va oxir bir xil
  })

  it("custom sana input'lari bor", () => {
    render(<DateRangePicker dan="2026-04-01" gacha="2026-04-16" onChange={() => {}} />)
    const inputs = screen.getAllByLabelText(/sana/i)
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Test ishga tushirish — FAIL**

Run: `npm run test:run -- test/components/DateRangePicker.test.tsx`
Expected: FAIL — import.

- [ ] **Step 3: Komponent yaratish**

`src/app/(dashboard)/sotuvlar/_components/DateRangePicker.tsx`:

```tsx
'use client'

import { useState } from 'react'

type Range = { dan: string; gacha: string }

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetRange(p: 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy'): Range {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  switch (p) {
    case 'bugun':
      return { dan: iso(bugun), gacha: iso(bugun) }
    case 'kecha': {
      const k = new Date(bugun); k.setDate(k.getDate() - 1)
      return { dan: iso(k), gacha: iso(k) }
    }
    case 'oxirgi7': {
      const dan = new Date(bugun); dan.setDate(dan.getDate() - 6)
      return { dan: iso(dan), gacha: iso(bugun) }
    }
    case 'shuOy': {
      const dan = new Date(bugun); dan.setDate(1)
      return { dan: iso(dan), gacha: iso(bugun) }
    }
    case 'otganOy': {
      const dan = new Date(bugun); dan.setMonth(dan.getMonth() - 1); dan.setDate(1)
      const gacha = new Date(bugun); gacha.setDate(0) // o'tgan oyning oxirgi kuni
      return { dan: iso(dan), gacha: iso(gacha) }
    }
  }
}

const btnCls = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition ${
    active
      ? 'bg-red-600 text-white'
      : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
  }`

const inputCls =
  'px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'

export function DateRangePicker({
  dan,
  gacha,
  onChange,
}: {
  dan: string
  gacha: string
  onChange: (r: Range) => void
}) {
  const [localDan, setLocalDan] = useState(dan)
  const [localGacha, setLocalGacha] = useState(gacha)

  const presets: Array<[string, ReturnType<typeof presetRange>, 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy']> = [
    ['Bugun', presetRange('bugun'), 'bugun'],
    ['Kecha', presetRange('kecha'), 'kecha'],
    ['Oxirgi 7 kun', presetRange('oxirgi7'), 'oxirgi7'],
    ['Shu oy', presetRange('shuOy'), 'shuOy'],
    ["O'tgan oy", presetRange('otganOy'), 'otganOy'],
  ]

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map(([label, r]) => {
        const active = dan === r.dan && gacha === r.gacha
        return (
          <button key={label} onClick={() => onChange(r)} className={btnCls(active)}>
            {label}
          </button>
        )
      })}
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="sana-dan">Boshlanish sanasi</label>
        <input
          id="sana-dan"
          aria-label="Boshlanish sanasi"
          type="date"
          value={localDan}
          onChange={(e) => {
            setLocalDan(e.target.value)
            if (localGacha && e.target.value <= localGacha) onChange({ dan: e.target.value, gacha: localGacha })
          }}
          className={inputCls}
        />
        <span className="text-gray-400 dark:text-gray-600">\u2014</span>
        <label className="sr-only" htmlFor="sana-gacha">Tugash sanasi</label>
        <input
          id="sana-gacha"
          aria-label="Tugash sanasi"
          type="date"
          value={localGacha}
          onChange={(e) => {
            setLocalGacha(e.target.value)
            if (localDan && localDan <= e.target.value) onChange({ dan: localDan, gacha: e.target.value })
          }}
          className={inputCls}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Test PASS**

Run: `npm run test:run -- test/components/DateRangePicker.test.tsx`
Expected: 3 test yashil.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/DateRangePicker.tsx" test/components/DateRangePicker.test.tsx
git commit -m "feat(sotuvlar): DateRangePicker komponent \u2014 presetlar + custom sana"
```

---

### Task 14: ActiveFilterChips komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/ActiveFilterChips.tsx`
- Create: `test/components/ActiveFilterChips.test.tsx`

- [ ] **Step 1: Test**

`test/components/ActiveFilterChips.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveFilterChips } from '@/app/(dashboard)/sotuvlar/_components/ActiveFilterChips'

describe('ActiveFilterChips', () => {
  it("faol filterlar chip sifatida ko'rinadi", () => {
    render(
      <ActiveFilterChips
        labels={[
          { key: 'kassir', label: 'Kassir: Aziz' },
          { key: 'tolov', label: "To'lov: NAQD" },
        ]}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    )
    expect(screen.getByText('Kassir: Aziz')).toBeInTheDocument()
    expect(screen.getByText("To'lov: NAQD")).toBeInTheDocument()
    expect(screen.getByText("Hammasini tozalash")).toBeInTheDocument()
  })

  it('chip bosilganda onRemove chaqiriladi', async () => {
    const onRemove = vi.fn()
    render(
      <ActiveFilterChips
        labels={[{ key: 'kassir', label: 'Kassir: Aziz' }]}
        onRemove={onRemove}
        onClearAll={() => {}}
      />
    )
    await userEvent.click(screen.getByLabelText('Kassir: Aziz chip\'ini olib tashlash'))
    expect(onRemove).toHaveBeenCalledWith('kassir')
  })

  it("\"Hammasini tozalash\" bosilganda onClearAll chaqiriladi", async () => {
    const onClearAll = vi.fn()
    render(
      <ActiveFilterChips
        labels={[{ key: 'kassir', label: 'X' }]}
        onRemove={() => {}}
        onClearAll={onClearAll}
      />
    )
    await userEvent.click(screen.getByText('Hammasini tozalash'))
    expect(onClearAll).toHaveBeenCalled()
  })

  it("labels bo'sh bo'lsa hech narsa render qilmaydi", () => {
    const { container } = render(
      <ActiveFilterChips labels={[]} onRemove={() => {}} onClearAll={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: FAIL -> Komponent yaratish**

`src/app/(dashboard)/sotuvlar/_components/ActiveFilterChips.tsx`:

```tsx
'use client'

import { X } from 'lucide-react'

export function ActiveFilterChips({
  labels,
  onRemove,
  onClearAll,
}: {
  labels: Array<{ key: string; label: string }>
  onRemove: (key: string) => void
  onClearAll: () => void
}) {
  if (labels.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {labels.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onRemove(key)}
          aria-label={`${label} chip'ini olib tashlash`}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-950/50 transition"
        >
          <span>{label}</span>
          <X size={12} />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 underline"
      >
        Hammasini tozalash
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Test PASS**

Run: `npm run test:run -- test/components/ActiveFilterChips.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/ActiveFilterChips.tsx" test/components/ActiveFilterChips.test.tsx
git commit -m "feat(sotuvlar): ActiveFilterChips komponent"
```

---

### Task 15: HeroMetrics komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/HeroMetrics.tsx`
- Create: `test/components/HeroMetrics.test.tsx`

- [ ] **Step 1: Test**

`test/components/HeroMetrics.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroMetrics } from '@/app/(dashboard)/sotuvlar/_components/HeroMetrics'

const data = {
  jamiSotuv: 47_250_000,
  sotuvSoni: 234,
  ortachaChek: 202_000,
  jamiFoyda: 12_400_000,
  oldingiDavr: {
    jamiSotuv: 40_000_000,
    sotuvSoni: 210,
    ortachaChek: 208_000,
    jamiFoyda: 10_000_000,
  },
  kunlikGrafik: Array.from({ length: 14 }, (_, i) => ({ sana: `2026-04-0${i}`, sotuv: i * 100 })),
}

describe('HeroMetrics', () => {
  it('hero sotuv qiymatini formatlangan ko\'rsatadi', () => {
    render(<HeroMetrics {...data} />)
    expect(screen.getByText(/47[\s,]?250[\s,]?000 so'm/)).toBeInTheDocument()
  })

  it("ijobiy taqqoslashda \u25B2 va yashil rang", () => {
    const { container } = render(<HeroMetrics {...data} />)
    const plus = container.querySelector('[data-testid="jamiSotuv-trend"]')
    expect(plus?.textContent).toContain('+18.1')
    expect(plus?.className).toContain('text-green')
  })

  it("salbiy taqqoslashda \u25BC va qizil rang", () => {
    const salbiy = { ...data, jamiSotuv: 30_000_000 }
    const { container } = render(<HeroMetrics {...salbiy} />)
    const trend = container.querySelector('[data-testid="jamiSotuv-trend"]')
    expect(trend?.textContent).toContain('\u25BC')
    expect(trend?.className).toContain('text-red')
  })

  it('sotuvlar soni kartasi ko\'rinadi', () => {
    render(<HeroMetrics {...data} />)
    expect(screen.getByText('Sotuvlar')).toBeInTheDocument()
    expect(screen.getByText('234 ta')).toBeInTheDocument()
  })

  it("eski = 0 bo'lsa taqqoslash ko'rsatilmaydi (null holat)", () => {
    const nolEski = { ...data, oldingiDavr: { ...data.oldingiDavr, jamiSotuv: 0 } }
    const { container } = render(<HeroMetrics {...nolEski} />)
    const trend = container.querySelector('[data-testid="jamiSotuv-trend"]')
    // null foiz -> ko'rsatkich chiqarilmaydi yoki '\u2014' ko'rsatiladi
    expect(trend?.textContent).not.toContain('+')
  })
})
```

- [ ] **Step 2: FAIL -> komponent**

`src/app/(dashboard)/sotuvlar/_components/HeroMetrics.tsx`:

```tsx
'use client'

import { formatSum } from '@/lib/utils'
import { hisoblaFoiz } from '@/lib/analitika'
import { ShoppingBag, TrendingUp, Receipt, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  jamiSotuv: number
  sotuvSoni: number
  ortachaChek: number
  jamiFoyda: number
  oldingiDavr: {
    jamiSotuv: number
    sotuvSoni: number
    ortachaChek: number
    jamiFoyda: number
  }
  kunlikGrafik: Array<{ sana: string; sotuv: number }>
}

function Trend({
  yangi,
  eski,
  yaxshiYuqori = true,
  testId,
}: {
  yangi: number
  eski: number
  yaxshiYuqori?: boolean
  testId?: string
}) {
  const foiz = hisoblaFoiz(yangi, eski)
  if (foiz === null) {
    return (
      <span data-testid={testId} className="text-xs text-gray-400 dark:text-gray-600">
        \u2014
      </span>
    )
  }
  const ijobiy = yaxshiYuqori ? foiz >= 0 : foiz <= 0
  const rang = ijobiy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const Ikonka = foiz >= 0 ? ArrowUp : ArrowDown
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1 text-xs font-medium ${rang}`}>
      <Ikonka size={12} strokeWidth={3} />
      {foiz > 0 ? '+' : ''}
      {foiz.toFixed(1)}%
    </span>
  )
}

export function HeroMetrics(props: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Hero metric (2x) */}
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 dark:text-gray-500 text-xs uppercase tracking-wider">JAMI SOTUV</p>
            <p className="text-gray-900 dark:text-gray-100 text-3xl lg:text-4xl font-bold mt-2">
              {formatSum(props.jamiSotuv)}
            </p>
            <div className="mt-2">
              <Trend yangi={props.jamiSotuv} eski={props.oldingiDavr.jamiSotuv} testId="jamiSotuv-trend" />
              <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">o'tgan davrga nisbatan</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shrink-0 ml-4">
            <ShoppingBag size={22} className="text-white" />
          </div>
        </div>
        {/* Sparkline */}
        <div className="h-12 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={props.kunlikGrafik}>
              <Line
                type="monotone"
                dataKey="sotuv"
                stroke="#DC2626"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ergash metric'lar */}
      <div className="grid grid-rows-3 gap-4">
        <SmallMetric
          ikonka={TrendingUp}
          sarlavha="Sotuvlar"
          qiymat={`${props.sotuvSoni} ta`}
          trend={<Trend yangi={props.sotuvSoni} eski={props.oldingiDavr.sotuvSoni} />}
          iconBg="bg-blue-500"
        />
        <SmallMetric
          ikonka={Receipt}
          sarlavha="O'rtacha chek"
          qiymat={formatSum(props.ortachaChek)}
          trend={<Trend yangi={props.ortachaChek} eski={props.oldingiDavr.ortachaChek} />}
          iconBg="bg-amber-500"
        />
        <SmallMetric
          ikonka={Sparkles}
          sarlavha="Sof foyda"
          qiymat={formatSum(props.jamiFoyda)}
          trend={<Trend yangi={props.jamiFoyda} eski={props.oldingiDavr.jamiFoyda} />}
          iconBg={props.jamiFoyda >= 0 ? 'bg-green-500' : 'bg-red-500'}
        />
      </div>
    </div>
  )
}

function SmallMetric({
  ikonka: Ikonka,
  sarlavha,
  qiymat,
  trend,
  iconBg,
}: {
  ikonka: React.ElementType
  sarlavha: string
  qiymat: string
  trend: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-500 dark:text-gray-500 text-xs">{sarlavha}</p>
          <p className="text-gray-900 dark:text-gray-100 text-lg font-bold mt-1">{qiymat}</p>
          <div className="mt-1">{trend}</div>
        </div>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0 ml-3`}>
          <Ikonka size={16} className="text-white" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test PASS**

Run: `npm run test:run -- test/components/HeroMetrics.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/HeroMetrics.tsx" test/components/HeroMetrics.test.tsx
git commit -m "feat(sotuvlar): HeroMetrics \u2014 hero + 3 ergash metric + sparkline + taqqoslash"
```

---

### Task 16: SalesTrendChart komponent

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/SalesTrendChart.tsx`

> **Eslatma:** Bu komponent asosan Recharts wrapper — test qilish faqat smoke darajada foydali (shape rendering jsdom'da cheklangan). Shu sababli alohida test yo'q, page test'da integratsiya qilinadi.

- [ ] **Step 1: Komponent**

`src/app/(dashboard)/sotuvlar/_components/SalesTrendChart.tsx`:

```tsx
'use client'

import {
  AreaChart, Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatSum } from '@/lib/utils'

interface Props {
  data: Array<{ sana: string; sotuv: number; sotuvSoni: number; oldingiSotuv: number }>
}

export function SalesTrendChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold">Sotuv dinamikasi</h2>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Shu davr</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-gray-400 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">Oldingi davr</span>
          </span>
        </div>
      </div>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="sotuvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="sana"
              stroke="#6b7280"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + 'M'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#f9fafb',
              }}
              formatter={(v: number | string, name: string) => {
                const nameMap: Record<string, string> = { sotuv: 'Shu davr', oldingiSotuv: 'Oldingi davr' }
                return [formatSum(Number(v)), nameMap[name] ?? name]
              }}
            />
            <Area
              type="monotone"
              dataKey="sotuv"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#sotuvGrad)"
            />
            <Line
              type="monotone"
              dataKey="oldingiSotuv"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/SalesTrendChart.tsx"
git commit -m "feat(sotuvlar): SalesTrendChart \u2014 AreaChart + oldingi davr chizig'i"
```

---

### Task 17: BreakdownTabs komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/BreakdownTabs.tsx`
- Create: `test/components/BreakdownTabs.test.tsx`

- [ ] **Step 1: Test**

`test/components/BreakdownTabs.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BreakdownTabs } from '@/app/(dashboard)/sotuvlar/_components/BreakdownTabs'
import type { AnalitikaJavobi } from '@/app/(dashboard)/sotuvlar/_types'

const data: AnalitikaJavobi = {
  jamiSotuv: 0, jamiQaytarish: 0, sotuvSoni: 0, ortachaChek: 0, jamiFoyda: 0, jamiChegirma: 0,
  oldingiDavr: { jamiSotuv: 0, sotuvSoni: 0, ortachaChek: 0, jamiFoyda: 0 },
  kunlikGrafik: [],
  kassirlar: [
    { kassirId: 'k1', ism: 'Aziz', sotuvSoni: 10, jami: 1_000_000, ortachaChek: 100_000, foyda: 300_000, qaytarishlarSoni: 0 },
  ],
  mijozlar: [
    { mijozId: 'm1', ism: 'Jahongir', telefon: '+998 90 123 45 67', sotuvSoni: 3, jami: 500_000, nasiyaQoldiq: 0 },
  ],
  tolovUsullari: [
    { tolovUsuli: 'NAQD', sotuvSoni: 10, jami: 1_000_000, ulush: 50 },
  ],
  topTovarlar: [
    { tovarId: 't1', nomi: 'Qazon', birlik: 'DONA', miqdor: 5, jami: 500_000, foyda: 100_000 },
  ],
  soatlar: Array.from({ length: 24 }, (_, i) => ({ soat: i, sotuvSoni: i === 14 ? 5 : 0, jami: i === 14 ? 700_000 : 0 })),
}

describe('BreakdownTabs', () => {
  it("5 ta tabni ko'rsatadi", () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    expect(screen.getByRole('tab', { name: /Kassirlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Mijozlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /To'lov/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tovarlar/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Soatlar/i })).toBeInTheDocument()
  })

  it("default tab = Kassirlar bo'lib, kassir ismi ko'rinadi", () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    expect(screen.getByText('Aziz')).toBeInTheDocument()
  })

  it("Mijozlar tabiga o'tish mijoz ma'lumotini ko'rsatadi", async () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    await userEvent.click(screen.getByRole('tab', { name: /Mijozlar/i }))
    expect(screen.getByText('Jahongir')).toBeInTheDocument()
  })

  it("Soatlar tabida peak soat (14) ta'kidlanadi", async () => {
    render(<BreakdownTabs data={data} onKassirClick={() => {}} onMijozClick={() => {}} onTolovClick={() => {}} />)
    await userEvent.click(screen.getByRole('tab', { name: /Soatlar/i }))
    expect(screen.getByText(/14:00/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: FAIL -> komponent**

`src/app/(dashboard)/sotuvlar/_components/BreakdownTabs.tsx`:

```tsx
'use client'

import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { formatSum } from '@/lib/utils'
import type { AnalitikaJavobi } from '../_types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const TOLOV_RANGLARI: Record<string, string> = {
  NAQD: '#16a34a',
  KARTA: '#2563eb',
  ARALASH: '#7c3aed',
  NASIYA: '#D4A017',
  SHERIK: '#6b7280',
}

const tabList = [
  ['kassirlar', 'Kassirlar'],
  ['mijozlar', 'Mijozlar'],
  ['tolov', "To'lov"],
  ['tovarlar', 'Tovarlar'],
  ['soatlar', 'Soatlar'],
] as const

interface Props {
  data: AnalitikaJavobi
  onKassirClick: (kassirId: string) => void
  onMijozClick: (mijozId: string) => void
  onTolovClick: (tolov: string) => void
}

export function BreakdownTabs({ data, onKassirClick, onMijozClick, onTolovClick }: Props) {
  const [tab, setTab] = useState<string>('kassirlar')
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 mb-4 overflow-x-auto">
          {tabList.map(([v, label]) => (
            <Tabs.Trigger
              key={v}
              value={v}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                tab === v
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
              }`}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="kassirlar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.kassirlar} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => (v / 1_000_000).toFixed(1) + 'M'} />
                  <YAxis type="category" dataKey="ism" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                    formatter={(v: number) => [formatSum(v), 'Jami']}
                  />
                  <Bar dataKey="jami" fill="#DC2626" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left py-2 px-2">Ism</th>
                    <th className="text-right py-2 px-2">Soni</th>
                    <th className="text-right py-2 px-2">Jami</th>
                    <th className="text-right py-2 px-2">Foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kassirlar.map((k) => (
                    <tr
                      key={k.kassirId}
                      onClick={() => onKassirClick(k.kassirId)}
                      className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-gray-100 dark:border-neutral-800/50"
                    >
                      <td className="py-2 px-2">{k.ism}</td>
                      <td className="text-right py-2 px-2">{k.sotuvSoni}</td>
                      <td className="text-right py-2 px-2">{formatSum(k.jami)}</td>
                      <td className="text-right py-2 px-2 text-green-600 dark:text-green-400">{formatSum(k.foyda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="mijozlar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-2 px-2">Ism</th>
                  <th className="text-left py-2 px-2">Telefon</th>
                  <th className="text-right py-2 px-2">Soni</th>
                  <th className="text-right py-2 px-2">Jami</th>
                  <th className="text-right py-2 px-2">Nasiya qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {data.mijozlar.map((m) => (
                  <tr
                    key={m.mijozId}
                    onClick={() => onMijozClick(m.mijozId)}
                    className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-gray-100 dark:border-neutral-800/50"
                  >
                    <td className="py-2 px-2">{m.ism}</td>
                    <td className="py-2 px-2 text-gray-500">{m.telefon ?? '\u2014'}</td>
                    <td className="text-right py-2 px-2">{m.sotuvSoni}</td>
                    <td className="text-right py-2 px-2">{formatSum(m.jami)}</td>
                    <td className="text-right py-2 px-2 text-amber-600">{formatSum(m.nasiyaQoldiq)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="tolov">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.tolovUsullari} dataKey="jami" nameKey="tolovUsuli" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {data.tolovUsullari.map((t, i) => (
                      <Cell key={i} fill={TOLOV_RANGLARI[t.tolovUsuli] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                    formatter={(v: number) => [formatSum(v), 'Jami']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.tolovUsullari.map((t) => (
                <button
                  key={t.tolovUsuli}
                  onClick={() => onTolovClick(t.tolovUsuli)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: TOLOV_RANGLARI[t.tolovUsuli] ?? '#6b7280' }} />
                    <span className="text-gray-800 dark:text-gray-200 text-sm">{t.tolovUsuli}</span>
                  </span>
                  <span className="text-sm">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{formatSum(t.jami)}</span>
                    <span className="text-gray-500 ml-2">{t.ulush}%</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="tovarlar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-2 px-2">Tovar</th>
                  <th className="text-right py-2 px-2">Miqdor</th>
                  <th className="text-right py-2 px-2">Jami</th>
                  <th className="text-right py-2 px-2">Foyda</th>
                </tr>
              </thead>
              <tbody>
                {data.topTovarlar.map((t) => (
                  <tr key={t.tovarId} className="border-b border-gray-100 dark:border-neutral-800/50">
                    <td className="py-2 px-2">{t.nomi}</td>
                    <td className="text-right py-2 px-2">{t.miqdor} {t.birlik.toLowerCase()}</td>
                    <td className="text-right py-2 px-2">{formatSum(t.jami)}</td>
                    <td className="text-right py-2 px-2 text-green-600">{formatSum(t.foyda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="soatlar">
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.soatlar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="soat" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v}:00`} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + 'M'} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                  formatter={(v: number) => [formatSum(v), 'Jami']}
                  labelFormatter={(v) => `${v}:00`}
                />
                <Bar dataKey="jami" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Peak soat:{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(() => {
                const max = data.soatlar.reduce((m, s) => (s.jami > m.jami ? s : m), data.soatlar[0])
                return max ? `${max.soat}:00 \u2014 ${formatSum(max.jami)}` : '\u2014'
              })()}
            </span>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
```

- [ ] **Step 3: Test PASS**

Run: `npm run test:run -- test/components/BreakdownTabs.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/BreakdownTabs.tsx" test/components/BreakdownTabs.test.tsx
git commit -m "feat(sotuvlar): BreakdownTabs \u2014 5 tab (kassir/mijoz/to'lov/tovar/soat) + grafiklar"
```

---

### Task 18: SalesTable komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/SalesTable.tsx`
- Create: `test/components/SalesTable.test.tsx`

- [ ] **Step 1: Test**

`test/components/SalesTable.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SalesTable } from '@/app/(dashboard)/sotuvlar/_components/SalesTable'
import type { SotuvQatori } from '@/app/(dashboard)/sotuvlar/_types'

const rows: SotuvQatori[] = [
  {
    id: 's1',
    chekRaqami: 'CHK-260416-0001',
    sana: '2026-04-16T14:30:00.000Z',
    yakuniySumma: 450_000,
    chegirma: 0,
    tolovUsuli: 'NAQD',
    holati: 'YAKUNLANGAN',
    kassir: { ism: 'Aziz' },
    mijoz: { ism: 'Jahongir', telefon: '+998 90 123 45 67' },
    tarkiblar: [],
    nasiya: null,
  },
  {
    id: 's2',
    chekRaqami: 'CHK-260416-0002',
    sana: '2026-04-16T13:00:00.000Z',
    yakuniySumma: 120_000,
    chegirma: 0,
    tolovUsuli: 'KARTA',
    holati: 'YAKUNLANGAN',
    kassir: { ism: 'Aziz' },
    mijoz: null,
    tarkiblar: [],
    nasiya: null,
  },
]

describe('SalesTable', () => {
  it('qatorlarni render qiladi', () => {
    render(
      <SalesTable
        rows={rows}
        jami={2}
        page={1}
        limit={50}
        sort="sana"
        order="desc"
        onRowClick={() => {}}
        onSortChange={() => {}}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText('CHK-260416-0001')).toBeInTheDocument()
    expect(screen.getByText('CHK-260416-0002')).toBeInTheDocument()
    expect(screen.getByText('Jahongir')).toBeInTheDocument()
  })

  it("mijoz null bo'lsa \u2014 ko'rsatadi", () => {
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={() => {}} onPageChange={() => {}} />
    )
    const mijozless = screen.getByText('CHK-260416-0002').closest('tr')
    expect(mijozless?.textContent).toContain('\u2014')
  })

  it('qatorga bosilganda onRowClick chaqiriladi', async () => {
    const onRowClick = vi.fn()
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={onRowClick} onSortChange={() => {}} onPageChange={() => {}} />
    )
    await userEvent.click(screen.getByText('CHK-260416-0001'))
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
  })

  it("Sana ustunini bosganda onSortChange('sana') chaqiriladi", async () => {
    const onSortChange = vi.fn()
    render(
      <SalesTable rows={rows} jami={2} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={onSortChange} onPageChange={() => {}} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Sana/i }))
    expect(onSortChange).toHaveBeenCalledWith('sana')
  })

  it('pagination yuqoridan keyingi sahifaga o\'tadi', async () => {
    const onPageChange = vi.fn()
    render(
      <SalesTable rows={rows} jami={200} page={1} limit={50} sort="sana" order="desc" onRowClick={() => {}} onSortChange={() => {}} onPageChange={onPageChange} />
    )
    await userEvent.click(screen.getByRole('button', { name: /Keyingi/i }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
```

- [ ] **Step 2: Komponent**

`src/app/(dashboard)/sotuvlar/_components/SalesTable.tsx`:

```tsx
'use client'

import { formatSum } from '@/lib/utils'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SotuvQatori } from '../_types'

const TOLOV_BADGE: Record<string, string> = {
  NAQD: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  KARTA: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  ARALASH: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  NASIYA: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  SHERIK: 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300',
}

function formatSanaYaqin(iso: string) {
  const d = new Date(iso)
  const kun = String(d.getDate()).padStart(2, '0')
  const oy = String(d.getMonth() + 1).padStart(2, '0')
  const soat = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${kun}.${oy} ${soat}:${min}`
}

interface Props {
  rows: SotuvQatori[]
  jami: number
  page: number
  limit: number
  sort: 'sana' | 'yakuniySumma' | 'chekRaqami'
  order: 'asc' | 'desc'
  onRowClick: (row: SotuvQatori) => void
  onSortChange: (field: 'sana' | 'yakuniySumma' | 'chekRaqami') => void
  onPageChange: (page: number) => void
}

export function SalesTable({ rows, jami, page, limit, sort, order, onRowClick, onSortChange, onPageChange }: Props) {
  const sahifalar = Math.max(1, Math.ceil(jami / limit))
  const SortIcon = order === 'asc' ? ArrowUp : ArrowDown

  const SortBtn = ({ field, children }: { field: 'sana' | 'yakuniySumma' | 'chekRaqami'; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
    >
      {children}
      {sort === field && <SortIcon size={12} />}
    </button>
  )

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 text-sm text-gray-600 dark:text-gray-400">
        <span>Jami: <span className="font-medium text-gray-900 dark:text-gray-100">{jami}</span> ta sotuv</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800/50 sticky top-0">
            <tr className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              <th className="text-left py-3 px-4"><SortBtn field="sana">Sana</SortBtn></th>
              <th className="text-left py-3 px-4"><SortBtn field="chekRaqami">Chek #</SortBtn></th>
              <th className="text-left py-3 px-4">Kassir</th>
              <th className="text-left py-3 px-4">Mijoz</th>
              <th className="text-left py-3 px-4">To'lov</th>
              <th className="text-right py-3 px-4"><SortBtn field="yakuniySumma">Summa</SortBtn></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-600">
                  Ushbu davrda sotuv topilmadi
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r)}
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-gray-100 dark:border-neutral-800/50"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{formatSanaYaqin(r.sana)}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-900 dark:text-gray-100">{r.chekRaqami}</td>
                  <td className="py-3 px-4">{r.kassir.ism}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.mijoz?.ism ?? '\u2014'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TOLOV_BADGE[r.tolovUsuli] ?? ''}`}>
                      {r.tolovUsuli}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatSum(r.yakuniySumma)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-neutral-800">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          Sahifa {page} / {sahifalar}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Oldingi sahifa"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Oldingi
          </button>
          <button
            type="button"
            aria-label="Keyingi sahifa"
            disabled={page >= sahifalar}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40"
          >
            Keyingi <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test PASS**

Run: `npm run test:run -- test/components/SalesTable.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/SalesTable.tsx" test/components/SalesTable.test.tsx
git commit -m "feat(sotuvlar): SalesTable \u2014 saralash, pagination, to'lov badge'lari"
```

---

### Task 19: SaleDetailPanel komponent (TDD)

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/_components/SaleDetailPanel.tsx`
- Create: `test/components/SaleDetailPanel.test.tsx`

- [ ] **Step 1: Test**

`test/components/SaleDetailPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaleDetailPanel } from '@/app/(dashboard)/sotuvlar/_components/SaleDetailPanel'
import type { SotuvQatori } from '@/app/(dashboard)/sotuvlar/_types'

const sotuv: SotuvQatori = {
  id: 's1',
  chekRaqami: 'CHK-260416-0001',
  sana: '2026-04-16T14:30:00.000Z',
  yakuniySumma: 450_000,
  chegirma: 0,
  tolovUsuli: 'NAQD',
  holati: 'YAKUNLANGAN',
  kassir: { ism: 'Aziz Rahimov' },
  mijoz: { ism: 'Jahongir', telefon: '+998 90 123 45 67' },
  tarkiblar: [
    { tovar: { nomi: 'Qazon 65sm', birlik: 'DONA' }, miqdor: 1, birlikNarxi: 380_000, jami: 380_000 },
  ],
  nasiya: null,
}

describe('SaleDetailPanel', () => {
  it('open=false bo\'lsa render qilmaydi', () => {
    const { container } = render(
      <SaleDetailPanel open={false} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('chek raqami va kassir nomi render qilinadi', () => {
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/CHK-260416-0001/)).toBeInTheDocument()
    expect(screen.getByText('Aziz Rahimov')).toBeInTheDocument()
  })

  it("tarkiblar ro'yxati ko'rinadi", () => {
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/Qazon 65sm/)).toBeInTheDocument()
  })

  it("X tugmasi bosilganda onClose chaqiriladi", async () => {
    const onClose = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={onClose} onPrev={() => {}} onNext={() => {}} />
    )
    await userEvent.click(screen.getByLabelText('Yopish'))
    expect(onClose).toHaveBeenCalled()
  })

  it("Escape bosilganda onClose chaqiriladi", async () => {
    const onClose = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={onClose} onPrev={() => {}} onNext={() => {}} />
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it("Prev/Next tugmalar tegishli callback'larni chaqiradi", async () => {
    const onPrev = vi.fn(); const onNext = vi.fn()
    render(
      <SaleDetailPanel open={true} sotuv={sotuv} onClose={() => {}} onPrev={onPrev} onNext={onNext} />
    )
    await userEvent.click(screen.getByLabelText('Oldingi sotuv'))
    expect(onPrev).toHaveBeenCalled()
    await userEvent.click(screen.getByLabelText('Keyingi sotuv'))
    expect(onNext).toHaveBeenCalled()
  })

  it("nasiya mavjud bo'lsa nasiya bo'limi ko'rinadi", () => {
    const withNasiya: SotuvQatori = {
      ...sotuv,
      tolovUsuli: 'NASIYA',
      nasiya: { qoldiq: 200_000, muddat: '2026-05-16', holati: 'OCHIQ' },
    }
    render(
      <SaleDetailPanel open={true} sotuv={withNasiya} onClose={() => {}} onPrev={() => {}} onNext={() => {}} />
    )
    expect(screen.getByText(/NASIYA/)).toBeInTheDocument()
    expect(screen.getByText(/Qoldiq/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Komponent**

`src/app/(dashboard)/sotuvlar/_components/SaleDetailPanel.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Printer, Link as LinkIcon } from 'lucide-react'
import { formatSum } from '@/lib/utils'
import type { SotuvQatori } from '../_types'

interface Props {
  open: boolean
  sotuv: SotuvQatori | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function SaleDetailPanel({ open, sotuv, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.altKey && e.key === 'ArrowLeft') onPrev()
      if (e.altKey && e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, onPrev, onNext])

  if (!open || !sotuv) return null

  const chekLink = `/chek/${sotuv.chekRaqami}`

  return (
    <div
      role="dialog"
      aria-labelledby="sale-detail-title"
      className="fixed inset-0 z-50 flex"
    >
      <div className="flex-1 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="min-w-0">
            <h2 id="sale-detail-title" className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {sotuv.chekRaqami}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(sotuv.sana).toLocaleString('uz-UZ')}
            </p>
          </div>
          <div className="flex gap-1">
            <button aria-label="Oldingi sotuv" onClick={onPrev} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronLeft size={16} />
            </button>
            <button aria-label="Keyingi sotuv" onClick={onNext} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronRight size={16} />
            </button>
            <button aria-label="Yopish" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <section className="space-y-1">
            <Row label="Kassir" value={sotuv.kassir.ism} />
            <Row label="Mijoz" value={sotuv.mijoz?.ism ?? '\u2014'} />
            {sotuv.mijoz?.telefon && <Row label="Telefon" value={sotuv.mijoz.telefon} />}
            <Row label="To'lov" value={sotuv.tolovUsuli} />
            <Row label="Holati" value={sotuv.holati} />
          </section>

          <section>
            <h3 className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
              Tarkib ({sotuv.tarkiblar.length} ta)
            </h3>
            <ul className="space-y-2">
              {sotuv.tarkiblar.map((t, i) => (
                <li key={i} className="flex justify-between items-start text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 dark:text-gray-200 truncate">{t.tovar.nomi}</p>
                    <p className="text-xs text-gray-500">
                      {t.miqdor} {t.tovar.birlik.toLowerCase()} \u00D7 {formatSum(t.birlikNarxi)}
                    </p>
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 font-medium shrink-0 ml-2">
                    {formatSum(t.jami)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl space-y-1 text-sm">
            <Row label="Chegirma" value={formatSum(sotuv.chegirma)} />
            <Row label="Yakuniy" value={formatSum(sotuv.yakuniySumma)} bold />
          </section>

          {sotuv.nasiya && (
            <section className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <h3 className="text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-2">NASIYA</h3>
              <Row label="Qoldiq" value={formatSum(sotuv.nasiya.qoldiq)} />
              {sotuv.nasiya.muddat && (
                <Row label="Muddat" value={new Date(sotuv.nasiya.muddat).toLocaleDateString('uz-UZ')} />
              )}
              <Row label="Holat" value={sotuv.nasiya.holati} />
            </section>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <a
              href={chekLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700"
            >
              <Printer size={14} /> Chek
            </a>
            <button
              type="button"
              onClick={() => {
                const url = window.location.origin + chekLink
                void navigator.clipboard?.writeText(url)
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              <LinkIcon size={14} /> Linkni nusxalash
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value, bold = false }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 dark:text-gray-500">{label}</span>
      <span className={bold ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-800 dark:text-gray-200'}>
        {value}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Test PASS**

Run: `npm run test:run -- test/components/SaleDetailPanel.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/_components/SaleDetailPanel.tsx" test/components/SaleDetailPanel.test.tsx
git commit -m "feat(sotuvlar): SaleDetailPanel \u2014 slide-out + prev/next + klaviatura"
```

---

## FAZA 4: SAHIFA VA DASHBOARD INTEGRATSIYA

### Task 20: `/sotuvlar` sahifasini yig'ish

**Files:**
- Create: `src/app/(dashboard)/sotuvlar/page.tsx`

- [ ] **Step 1: Sahifa komponenti**

`src/app/(dashboard)/sotuvlar/page.tsx`:

```tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useSotuvlarFilters } from './_hooks/useSotuvlarFilters'
import type { AnalitikaJavobi, SotuvQatori } from './_types'
import { DateRangePicker } from './_components/DateRangePicker'
import { ActiveFilterChips } from './_components/ActiveFilterChips'
import { HeroMetrics } from './_components/HeroMetrics'
import { SalesTrendChart } from './_components/SalesTrendChart'
import { BreakdownTabs } from './_components/BreakdownTabs'
import { SalesTable } from './_components/SalesTable'
import { SaleDetailPanel } from './_components/SaleDetailPanel'
import { HeroMetricsSkeleton, ChartSkeleton, TableSkeleton } from './_components/SkeletonLoaders'

export default function SotuvlarPage() {
  const { filtrlar, yangilash, tozalash } = useSotuvlarFilters()
  const [analitika, setAnalitika] = useState<AnalitikaJavobi | null>(null)
  const [sotuvlar, setSotuvlar] = useState<SotuvQatori[]>([])
  const [jami, setJami] = useState(0)
  const [yuklanmoqda, setYuklanmoqda] = useState(true)
  const [tanlangan, setTanlangan] = useState<SotuvQatori | null>(null)

  // Analitika fetch (dan/gacha/kassir/mijoz/tolov o'zgarganda)
  useEffect(() => {
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
    })
    fetch(`/api/sotuvlar/analitika?${qs}`)
      .then((r) => r.json())
      .then(setAnalitika)
      .catch(() => setAnalitika(null))
  }, [filtrlar.dan, filtrlar.gacha, filtrlar.kassirId, filtrlar.mijozId, filtrlar.tolovUsuli])

  // Jadval fetch (barcha filtr + pagination + sort)
  useEffect(() => {
    setYuklanmoqda(true)
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      page: String(filtrlar.page),
      limit: String(filtrlar.limit),
      sort: filtrlar.sort,
      order: filtrlar.order,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
      ...(filtrlar.q ? { q: filtrlar.q } : {}),
    })
    fetch(`/api/sotuvlar?${qs}`)
      .then((r) => r.json())
      .then((res) => {
        setSotuvlar(res.sotuvlar ?? [])
        setJami(res.jami ?? 0)
      })
      .finally(() => setYuklanmoqda(false))
  }, [filtrlar])

  const activeChips = useMemo(() => {
    const arr: Array<{ key: string; label: string }> = []
    if (filtrlar.kassirId) arr.push({ key: 'kassirId', label: `Kassir tanlangan` })
    if (filtrlar.mijozId) arr.push({ key: 'mijozId', label: `Mijoz tanlangan` })
    if (filtrlar.tolovUsuli) arr.push({ key: 'tolovUsuli', label: `To'lov: ${filtrlar.tolovUsuli}` })
    if (filtrlar.q) arr.push({ key: 'q', label: `Qidiruv: ${filtrlar.q}` })
    return arr
  }, [filtrlar])

  function downloadExcel() {
    const qs = new URLSearchParams({
      dan: filtrlar.dan,
      gacha: filtrlar.gacha,
      ...(filtrlar.kassirId ? { kassirId: filtrlar.kassirId } : {}),
      ...(filtrlar.mijozId ? { mijozId: filtrlar.mijozId } : {}),
      ...(filtrlar.tolovUsuli ? { tolovUsuli: filtrlar.tolovUsuli } : {}),
    })
    window.location.href = `/api/sotuvlar/export?${qs}`
  }

  function prev() {
    if (!tanlangan) return
    const i = sotuvlar.findIndex((s) => s.id === tanlangan.id)
    if (i > 0) setTanlangan(sotuvlar[i - 1])
  }
  function next() {
    if (!tanlangan) return
    const i = sotuvlar.findIndex((s) => s.id === tanlangan.id)
    if (i < sotuvlar.length - 1 && i !== -1) setTanlangan(sotuvlar[i + 1])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sotuvlar hisoboti</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadExcel}
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="space-y-3">
        <DateRangePicker
          dan={filtrlar.dan}
          gacha={filtrlar.gacha}
          onChange={({ dan, gacha }) => yangilash({ dan, gacha })}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Qidiruv: chek raqami, mijoz ismi..."
            defaultValue={filtrlar.q ?? ''}
            onChange={(e) => {
              const v = e.target.value
              const t = window.setTimeout(() => yangilash({ q: v || undefined }), 300)
              ;(e.target as any)._t && clearTimeout((e.target as any)._t)
              ;(e.target as any)._t = t
            }}
            className="flex-1 min-w-[200px] max-w-md px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <ActiveFilterChips
            labels={activeChips}
            onRemove={(k) => yangilash({ [k]: undefined } as any)}
            onClearAll={tozalash}
          />
        </div>
      </div>

      {/* Hero metrics */}
      {analitika ? (
        <HeroMetrics
          jamiSotuv={analitika.jamiSotuv}
          sotuvSoni={analitika.sotuvSoni}
          ortachaChek={analitika.ortachaChek}
          jamiFoyda={analitika.jamiFoyda}
          oldingiDavr={analitika.oldingiDavr}
          kunlikGrafik={analitika.kunlikGrafik}
        />
      ) : (
        <HeroMetricsSkeleton />
      )}

      {/* Trend chart */}
      {analitika ? <SalesTrendChart data={analitika.kunlikGrafik} /> : <ChartSkeleton />}

      {/* Breakdown tabs */}
      {analitika && (
        <BreakdownTabs
          data={analitika}
          onKassirClick={(kassirId) => yangilash({ kassirId })}
          onMijozClick={(mijozId) => yangilash({ mijozId })}
          onTolovClick={(tolovUsuli) => yangilash({ tolovUsuli: tolovUsuli as any })}
        />
      )}

      {/* Table */}
      {yuklanmoqda ? (
        <TableSkeleton rows={8} />
      ) : (
        <SalesTable
          rows={sotuvlar}
          jami={jami}
          page={filtrlar.page}
          limit={filtrlar.limit}
          sort={filtrlar.sort}
          order={filtrlar.order}
          onRowClick={setTanlangan}
          onSortChange={(field) =>
            yangilash({
              sort: field,
              order: filtrlar.sort === field && filtrlar.order === 'desc' ? 'asc' : 'desc',
            })
          }
          onPageChange={(page) => yangilash({ page })}
        />
      )}

      {/* Detail panel */}
      <SaleDetailPanel
        open={!!tanlangan}
        sotuv={tanlangan}
        onClose={() => setTanlangan(null)}
        onPrev={prev}
        onNext={next}
      />

      {yuklanmoqda && !analitika && (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-md">
          <Loader2 size={14} className="animate-spin text-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Yuklanmoqda...</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Xato yo'q.

- [ ] **Step 3: Dev server ishga tushirish va qo'lda smoke test**

Run: `npm run dev`
Brauzerda `http://localhost:3000/login` ga kiring, `/sotuvlar` ga o'ting — sahifa ochilsin va ma'lumot yuklansin.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/sotuvlar/page.tsx"
git commit -m "feat(sotuvlar): /sotuvlar sahifasi yig'ildi (hero, chart, tabs, jadval, detail)"
```

---

### Task 21: Dashboard "Sotuv" kartasini clickable qilish

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: `StatCard` komponentiga `href` prop qo'shish**

`src/app/(dashboard)/page.tsx` ni oching va `StatCard` komponent signaturasini quyidagicha yangilang:

```tsx
import Link from 'next/link'

function StatCard({
  icon: Icon, sarlavha, qiymat, rang, iconBg, qoshimcha, href,
}: {
  icon: React.ElementType
  sarlavha: string
  qiymat: string
  rang: string
  iconBg: string
  qoshimcha?: string
  href?: string
}) {
  const body = (
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 dark:text-gray-500 text-sm">{sarlavha}</p>
        <p className={`text-2xl font-bold mt-1 ${rang}`}>{qiymat}</p>
        {qoshimcha && <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">{qoshimcha}</p>}
      </div>
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0 ml-3`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  )

  const className = `bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 transition ${
    href ? 'hover:shadow-md hover:ring-2 hover:ring-red-500/30 cursor-pointer' : 'hover:shadow-md'
  }`

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}
```

- [ ] **Step 2: "Sotuv" karta'ga `href` qo'shish**

Xuddi shu faylda `StatCard` chaqiruvlarini topib, "Sotuv" kartasiga `href="/sotuvlar"` qo'shing:

```tsx
<StatCard
  icon={ShoppingBag}
  sarlavha="Sotuv"
  qiymat={formatSum(data.jamiSotuv)}
  rang="text-gray-900 dark:text-gray-100"
  iconBg="bg-red-500"
  qoshimcha={`${data.sotuvSoni} ta sotuv`}
  href="/sotuvlar"
/>
```

- [ ] **Step 3: Typecheck + manual smoke test**

Run: `npx tsc --noEmit`

Brauzerda dashboard'ga o'ting → "Sotuv" kartasi cursor-pointer bo'lganini ko'ring, bosing → `/sotuvlar` ga o'tadi.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/page.tsx"
git commit -m "feat(dashboard): Sotuv kartasi /sotuvlar'ga link \u2014 hisobotlar sahifasiga kirish"
```

---

## FAZA 5: E2E VA FINALLASH

### Task 22: E2E test — asosiy oqim

**Files:**
- Create: `e2e/sotuvlar.spec.ts`
- Create: `e2e/helpers.ts` (login helper)

> **Talab:** E2E'lar uchun kamida bitta test foydalanuvchi DB'da bo'lishi kerak. Agar seed faylda ADMIN yaratiladi — shu login/parol bilan foydalaning. Aks holda, testni skip qilish variantini qoldirish.

- [ ] **Step 1: Login helper**

`e2e/helpers.ts`:

```typescript
import type { Page } from '@playwright/test'

export async function login(page: Page, login = 'admin', parol = 'admin123') {
  await page.goto('/login')
  await page.fill('input[name="login"]', login)
  await page.fill('input[name="parol"]', parol)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(?!login)/)
}
```

> **Eslatma:** Login forma selektorlari mavjud `LoginForm.tsx`'ga mos kelishi kerak. Agar name attributi farq qilsa — loginForm kodiga qarab to'g'rilang.

- [ ] **Step 2: E2E sotuvlar**

`e2e/sotuvlar.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('/sotuvlar sahifasi', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test("Dashboard \"Sotuv\" karta -> /sotuvlar sahifasi", async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/sotuvlar"]')
    await expect(page).toHaveURL(/\/sotuvlar/)
    await expect(page.locator('h1')).toContainText('Sotuvlar hisoboti')
  })

  test("default davr = shu oy", async ({ page }) => {
    await page.goto('/sotuvlar')
    // Preset tugmasi "Shu oy" active bo'lsin
    const shuOy = page.locator('button', { hasText: 'Shu oy' })
    await expect(shuOy).toBeVisible()
  })

  test("\"Bugun\" preset bosilganda URL yangilanadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    await page.click('button:has-text("Bugun")')
    const iso = new Date().toISOString().slice(0, 10)
    await expect(page).toHaveURL(new RegExp(`dan=${iso}.*gacha=${iso}`))
  })

  test("Hero metric ko'rinadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    await expect(page.locator('text=JAMI SOTUV')).toBeVisible()
    await expect(page.locator('text=Sotuvlar')).toBeVisible()
  })

  test("Tab'lar \u2014 Kassirlar, Mijozlar, To'lov, Tovarlar, Soatlar", async ({ page }) => {
    await page.goto('/sotuvlar')
    for (const name of ['Kassirlar', 'Mijozlar', "To'lov", 'Tovarlar', 'Soatlar']) {
      await expect(page.locator('[role="tab"]', { hasText: name })).toBeVisible()
    }
  })

  test("Jadvaldagi qatorga bosish slide-out ni ochadi", async ({ page }) => {
    await page.goto('/sotuvlar')
    // Birinchi qator (agar bor bo'lsa) — aks holda testni skip qilish
    const firstRow = page.locator('table tbody tr').first()
    if ((await firstRow.count()) === 0) test.skip()
    await firstRow.click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    // Escape yopadi
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})
```

- [ ] **Step 3: Dev serverda ishga tushirish va test**

Run: `npm run dev` (alohida terminal'da) va
Run: `npm run e2e -- e2e/sotuvlar.spec.ts`
Expected: Testlar yashil (yoki ma'lumot yo'q bo'lgan test skip).

- [ ] **Step 4: Commit**

```bash
git add e2e/helpers.ts e2e/sotuvlar.spec.ts
git commit -m "test(e2e): sotuvlar sahifasi \u2014 asosiy oqim (dashboard\u2192sahifa, filter, jadval, detail)"
```

---

### Task 23: E2E test — Excel eksport

**Files:**
- Create: `e2e/export.spec.ts`

- [ ] **Step 1: Test yozish**

`e2e/export.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Excel eksport download qiladi', async ({ page }) => {
  await login(page)
  await page.goto('/sotuvlar')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Excel")'),
  ])

  const fileName = download.suggestedFilename()
  expect(fileName).toMatch(/\.xlsx$/)
})
```

- [ ] **Step 2: Ishga tushirish**

Run: `npm run e2e -- e2e/export.spec.ts`

- [ ] **Step 3: Commit**

```bash
git add e2e/export.spec.ts
git commit -m "test(e2e): Excel eksport download tekshiruvi"
```

---

### Task 24: Coverage, build, yakuniy tekshirish

- [ ] **Step 1: To'liq test suite ishga tushirish**

Run: `npm run test:coverage`
Expected: Barcha test yashil. Coverage HTML `coverage/index.html` da.

`coverage/index.html`'ni brauzerda oching va quyidagilarni tasdiqlang:
- `src/lib/analitika.ts` \u2014 ≥ 95%
- `src/app/api/sotuvlar/analitika/route.ts` \u2014 ≥ 85%
- `src/app/api/sotuvlar/route.ts` \u2014 ≥ 85%
- `src/app/api/sotuvlar/export/route.ts` \u2014 ≥ 85%
- `src/app/(dashboard)/sotuvlar/_components/*` \u2014 ≥ 70% (har biri)

Agar coverage past bo'lsa, yetishmayotgan test'lar qo'shing.

- [ ] **Step 2: ESLint + TypeScript**

Run: `npm run lint && npx tsc --noEmit`
Expected: Xato va warning yo'q.

- [ ] **Step 3: Next.js build**

Run: `npm run build`
Expected: Build muvaffaqiyatli, `/sotuvlar` route'i compile'da ko'rinadi.

- [ ] **Step 4: E2E to'liq suite**

Run: `npm run e2e`
Expected: Barcha spec'lar yashil.

- [ ] **Step 5: Yakuniy commit (agar coverage uchun kichik tuzatishlar bo'lsa)**

```bash
git add .
git commit -m "test: coverage yaxshilashlar va yakuniy tasdiqlash"
```

- [ ] **Step 6: Remote'ga push (ixtiyoriy — agar branch'ni ulashish kerak bo'lsa)**

Run: `git push -u origin claude/gracious-leakey`

---

## QABUL MEZONI (Acceptance criteria)

Hammasi bajarilgan hisoblanishi uchun:

1. ✅ `/sotuvlar` sahifasi mavjud va yuklanadi
2. ✅ Dashboard'dagi "Sotuv" kartasi clickable va `/sotuvlar` ga yo'naltiradi
3. ✅ Hero metric 2x o'lchamda jami sotuvni ko'rsatadi, sparkline va taqqoslash bor
4. ✅ 3 ta ergash metric (sotuvlar soni, o'rtacha chek, sof foyda) taqqoslash bilan
5. ✅ Sotuv dinamikasi grafigi shu davr + oldingi davr bilan ko'rsatadi
6. ✅ 5 ta breakdown tab (kassirlar, mijozlar, to'lov, tovarlar, soatlar)
7. ✅ Sotuvlar jadvali pagination, saralash, to'lov badge'lari bilan
8. ✅ Qatorga bosilganda slide-out detail panel ochiladi (prev/next, Escape, klaviatura)
9. ✅ Filtrlar URL'ga yoziladi (share, bookmark ishlaydi)
10. ✅ "Hammasini tozalash" va chip'dan alohida olib tashlash ishlaydi
11. ✅ Excel eksport 3 sheet bilan yuklanadi
12. ✅ Skeleton loader'lar birinchi yuklanishda ko'rinadi
13. ✅ Dark mode'da barcha element'lar to'g'ri
14. ✅ `npm run test:run` — hamma testlar yashil
15. ✅ `npm run e2e` — hamma E2E'lar yashil
16. ✅ Coverage: API ≥ 85%, UI ≥ 70%, analitika matematika 100%
17. ✅ `npm run build` muvaffaqiyatli
18. ✅ `npx tsc --noEmit` xato yo'q
19. ✅ `npm run lint` xato yo'q
20. ✅ GitHub Actions CI push yoki PR'da yashil
