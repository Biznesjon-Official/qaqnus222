import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSum(summa: number | string) {
  const n = typeof summa === 'string' ? parseFloat(summa) : summa
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

export function formatSana(sana: Date | string) {
  const d = typeof sana === 'string' ? new Date(sana) : sana
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatSanaVaVaqt(sana: Date | string) {
  const d = typeof sana === 'string' ? new Date(sana) : sana
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateChekRaqami(): string {
  const sana = new Date()
  const yil = sana.getFullYear().toString().slice(-2)
  const oy = String(sana.getMonth() + 1).padStart(2, '0')
  const kun = String(sana.getDate()).padStart(2, '0')
  const tasodifiy = Math.floor(Math.random() * 9000) + 1000
  return `CHK-${yil}${oy}${kun}-${tasodifiy}`
}

// Format a number as Uzbek currency with so'm suffix using ru-RU locale (space-separated thousands)
export function formatMoney(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return "0 so'm"
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + " so'm"
}

// Format a number in short human-readable form (mln, mlrd, ming)
export function formatMoneyShort(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return "0"
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' ming'
  return String(Math.round(n))
}

// Format a phone number string to +998 (XX) XXX-XX-XX display format
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '').replace(/^998/, '').slice(0, 9)
  if (digits.length !== 9) return phone
  return `+998 (${digits.slice(0,2)}) ${digits.slice(2,5)}-${digits.slice(5,7)}-${digits.slice(7,9)}`
}
