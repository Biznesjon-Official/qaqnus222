'use client'

import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export default function Combobox({
  options, value, onChange,
  placeholder = "Tanlang...",
  searchPlaceholder = "Qidirish...",
  emptyMessage = "Topilmadi",
  disabled = false,
  className
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [open])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-sm transition',
            'hover:border-gray-400 dark:hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className={selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onChange('') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onChange('') } }}
                className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 rounded transition"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={14} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[9999] w-[var(--radix-popover-trigger-width)] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {/* Search input area */}
          <div className="p-2 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-600 text-sm py-4">{emptyMessage}</p>
            ) : filtered.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition',
                  option.value === value
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                )}
              >
                {option.label}
                {option.value === value && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
