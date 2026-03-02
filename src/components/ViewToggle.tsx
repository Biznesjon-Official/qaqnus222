'use client'
import { LayoutGrid, LayoutList } from 'lucide-react'

interface Props {
  view: 'table' | 'card'
  onChange: (v: 'table' | 'card') => void
}

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 gap-1">
      <button
        onClick={() => onChange('table')}
        className={`p-1.5 rounded-lg transition ${view === 'table' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        aria-label="Jadval ko'rinishi"
        title="Jadval ko'rinishi"
      >
        <LayoutList size={16} />
      </button>
      <button
        onClick={() => onChange('card')}
        className={`p-1.5 rounded-lg transition ${view === 'card' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        aria-label="Karta ko'rinishi"
        title="Karta ko'rinishi"
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  )
}
