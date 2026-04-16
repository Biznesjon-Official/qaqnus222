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
