'use client'

import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value: string          // stored as yyyy-mm-dd
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// Format digits into dd.mm.yyyy
function formatDigits(digits: string): string {
  const d = digits.slice(0, 8)
  if (d.length === 0) return ''
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`
}

// Convert yyyy-mm-dd to 8 digits (ddmmyyyy)
function toDigits(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return ''
  return `${parts[2]}${parts[1]}${parts[0]}`
}

// Convert 8 digits (ddmmyyyy) to yyyy-mm-dd
function toIso(digits: string): string {
  if (digits.length !== 8) return ''
  const dd = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const yyyy = digits.slice(4, 8)
  return `${yyyy}-${mm}-${dd}`
}

export default function DateInput({
  value, onChange,
  placeholder = 'kk.oo.yyyy',
  required = false,
  disabled = false,
  className
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const digits = toDigits(value)
  const displayValue = formatDigits(digits)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    if (raw.length === 8) {
      onChange(toIso(raw))
    } else if (raw.length === 0) {
      onChange('')
    } else {
      // Store partial as-is so user can keep typing
      // We keep the last valid iso or empty
      onChange(value)
      // Update display via ref
      if (inputRef.current) {
        inputRef.current.value = formatDigits(raw)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    // Allow ctrl/cmd shortcuts
    if (e.ctrlKey || e.metaKey) return
    // Block non-digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl transition',
      'focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent',
      disabled && 'opacity-50',
      className
    )}>
      <Calendar size={16} className="text-gray-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
      />
    </div>
  )
}
