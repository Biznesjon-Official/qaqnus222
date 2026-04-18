'use client'

import { useSession } from 'next-auth/react'
import { Suspense, lazy } from 'react'
import { useReportFilters } from './_hooks/useReportFilters'
import { ReportFilter } from './_components/ReportFilter'
import { SkeletonKPI, SkeletonChart } from './_components/Skeletons'

const UmumiyTab = lazy(() =>
  import('./_tabs/UmumiyTab').then((m) => ({ default: m.UmumiyTab })),
)
const SotuvTab = lazy(() =>
  import('./_tabs/SotuvTab').then((m) => ({ default: m.SotuvTab })),
)
const TovarlarTab = lazy(() =>
  import('./_tabs/TovarlarTab').then((m) => ({ default: m.TovarlarTab })),
)
const OmborTab = lazy(() =>
  import('./_tabs/OmborTab').then((m) => ({ default: m.OmborTab })),
)
const MijozlarTab = lazy(() =>
  import('./_tabs/MijozlarTab').then((m) => ({ default: m.MijozlarTab })),
)
const NasiyaTab = lazy(() =>
  import('./_tabs/NasiyaTab').then((m) => ({ default: m.NasiyaTab })),
)
const KassirlarTab = lazy(() =>
  import('./_tabs/KassirlarTab').then((m) => ({ default: m.KassirlarTab })),
)

const TAB_LIST: Array<{ key: string; label: string; adminOnly?: boolean }> = [
  { key: 'umumiy', label: 'Umumiy' },
  { key: 'sotuv', label: 'Sotuv' },
  { key: 'tovarlar', label: 'Tovarlar', adminOnly: true },
  { key: 'ombor', label: 'Ombor', adminOnly: true },
  { key: 'mijozlar', label: 'Mijozlar', adminOnly: true },
  { key: 'nasiya', label: 'Nasiya', adminOnly: true },
  { key: 'kassirlar', label: 'Kassirlar', adminOnly: true },
]

const TAB_COMPONENTS = {
  umumiy: UmumiyTab,
  sotuv: SotuvTab,
  tovarlar: TovarlarTab,
  ombor: OmborTab,
  mijozlar: MijozlarTab,
  nasiya: NasiyaTab,
  kassirlar: KassirlarTab,
} as const

// Inner component that uses useSearchParams (via useReportFilters) — must be inside Suspense
function HisobotlarInner({ isKassir }: { isKassir: boolean }) {
  const { filtrlar, yangilash } = useReportFilters()

  const visibleTabs = TAB_LIST.filter((t) => !t.adminOnly || !isKassir)
  const ActiveTab =
    TAB_COMPONENTS[filtrlar.tab as keyof typeof TAB_COMPONENTS] ?? UmumiyTab

  return (
    <>
      {/* Filter */}
      <ReportFilter
        tur={filtrlar.tur}
        dan={filtrlar.dan}
        gacha={filtrlar.gacha}
        onChange={yangilash}
      />

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-neutral-800 -mb-px">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => yangilash({ tab: t.key })}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              filtrlar.tab === t.key
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab (lazy) */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <SkeletonKPI />
            <SkeletonChart />
          </div>
        }
      >
        <ActiveTab filtrlar={filtrlar} isKassir={isKassir} />
      </Suspense>
    </>
  )
}

export default function HisobotlarPage() {
  const { data: session } = useSession()
  const isKassir = (session?.user as { rol?: string } | undefined)?.rol === 'KASSIR'

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <SkeletonKPI />
            <SkeletonChart />
          </div>
        }
      >
        <HisobotlarInner isKassir={isKassir} />
      </Suspense>
    </div>
  )
}
