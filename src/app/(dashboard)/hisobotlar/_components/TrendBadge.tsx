'use client'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { foizOzgarish } from '@/lib/hisobotlar'

export function TrendBadge({
  yangi,
  eski,
  yaxshiYuqori = true,
}: {
  yangi: number
  eski: number
  yaxshiYuqori?: boolean
}) {
  const foiz = foizOzgarish(yangi, eski)
  if (foiz === null)
    return <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
  const ijobiy = yaxshiYuqori ? foiz >= 0 : foiz <= 0
  const rang = ijobiy
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
  const Ikon = foiz >= 0 ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${rang}`}>
      <Ikon size={12} strokeWidth={3} aria-hidden />
      <span>{foiz >= 0 ? '▲' : '▼'}</span>
      {foiz > 0 ? '+' : ''}
      {foiz.toFixed(1)}%
    </span>
  )
}
