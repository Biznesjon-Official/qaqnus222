'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  value: string | number   // raw number as string (e.g. "1500000" yoki USD uchun "150.50")
  onChange: (value: string) => void
  placeholder?: string
  min?: number
  max?: number
  required?: boolean
  disabled?: boolean
  className?: string
  suffix?: string  // override; default UZS uchun "so'm", USD uchun yo'q ($ prefix bor)
  valyuta?: 'UZS' | 'USD'  // valyuta — UI moslashadi (USD'da $ prefix, decimal qabul)
}

// Format raqam stringi: USD'da decimal saqlanadi, UZS'da faqat butun
function formatWithCommas(val: string, isUsd: boolean): string {
  if (!val) return ''
  if (isUsd) {
    const cleaned = val.replace(/[^\d.]/g, '')
    if (!cleaned) return ''
    const [intPart, decPart] = cleaned.split('.')
    const formattedInt = Number(intPart || 0).toLocaleString('en-US')
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
  }
  const num = val.replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('en-US')
}

export default function MoneyInput({
  value, onChange,
  placeholder = "0",
  min,
  max,
  required = false,
  disabled = false,
  className,
  suffix,
  valyuta,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const isUsd = valyuta === 'USD'

  // Suffix mantig'i:
  // - explicit suffix bor — uni ishlatamiz
  // - valyuta='USD' — suffix yo'q ($ prefix bor)
  // - default — "so'm"
  const computedSuffix = suffix !== undefined ? suffix : (isUsd ? '' : "so'm")

  const displayValue = value ? formatWithCommas(String(value), isUsd) : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputValue = e.target.value
    let raw: string
    if (isUsd) {
      // USD: decimal qabul, lekin bitta nuqta va max 2 ta decimal
      raw = inputValue.replace(/[^\d.]/g, '')
      const dotIdx = raw.indexOf('.')
      if (dotIdx !== -1) {
        // Birinchidan keyingi nuqtalarni olib tashlaymiz
        raw = raw.slice(0, dotIdx + 1) + raw.slice(dotIdx + 1).replace(/\./g, '')
        const [intPart, decPart] = raw.split('.')
        if (decPart && decPart.length > 2) {
          raw = `${intPart}.${decPart.slice(0, 2)}`
        }
      }
    } else {
      raw = inputValue.replace(/\D/g, '')
    }
    if (max !== undefined && raw && Number(raw) > max) {
      onChange(String(max))
      return
    }
    onChange(raw)
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl transition',
      'focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent',
      disabled && 'opacity-50',
      className
    )}>
      {isUsd && (
        <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 whitespace-nowrap">$</span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode={isUsd ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none min-w-0"
      />
      {computedSuffix && displayValue && (
        <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 whitespace-nowrap">{computedSuffix}</span>
      )}
    </div>
  )
}
