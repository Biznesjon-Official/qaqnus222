'use client'

export function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 animate-pulse"
        >
          <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-6 w-28 bg-gray-200 dark:bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 dark:bg-neutral-800 rounded mb-4" />
      <div className="h-48 bg-gray-100 dark:bg-neutral-800 rounded" />
    </div>
  )
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 dark:bg-neutral-800 rounded" />
      ))}
    </div>
  )
}
