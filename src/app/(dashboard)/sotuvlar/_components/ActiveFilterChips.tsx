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
