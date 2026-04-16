'use client'

import { formatSum } from '@/lib/utils'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SotuvQatori } from '../_types'

const TOLOV_BADGE: Record<string, string> = {
  NAQD: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  KARTA: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  ARALASH: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  NASIYA: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  SHERIK: 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300',
}

function formatSanaYaqin(iso: string) {
  const d = new Date(iso)
  const kun = String(d.getDate()).padStart(2, '0')
  const oy = String(d.getMonth() + 1).padStart(2, '0')
  const soat = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${kun}.${oy} ${soat}:${min}`
}

interface Props {
  rows: SotuvQatori[]
  jami: number
  page: number
  limit: number
  sort: 'sana' | 'yakuniySumma' | 'chekRaqami'
  order: 'asc' | 'desc'
  onRowClick: (row: SotuvQatori) => void
  onSortChange: (field: 'sana' | 'yakuniySumma' | 'chekRaqami') => void
  onPageChange: (page: number) => void
}

export function SalesTable({ rows, jami, page, limit, sort, order, onRowClick, onSortChange, onPageChange }: Props) {
  const sahifalar = Math.max(1, Math.ceil(jami / limit))
  const SortIcon = order === 'asc' ? ArrowUp : ArrowDown

  const SortBtn = ({ field, children }: { field: 'sana' | 'yakuniySumma' | 'chekRaqami'; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
    >
      {children}
      {sort === field && <SortIcon size={12} />}
    </button>
  )

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 text-sm text-gray-600 dark:text-gray-400">
        <span>Jami: <span className="font-medium text-gray-900 dark:text-gray-100">{jami}</span> ta sotuv</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800/50 sticky top-0">
            <tr className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              <th className="text-left py-3 px-4"><SortBtn field="sana">Sana</SortBtn></th>
              <th className="text-left py-3 px-4"><SortBtn field="chekRaqami">Chek #</SortBtn></th>
              <th className="text-left py-3 px-4">Kassir</th>
              <th className="text-left py-3 px-4">Mijoz</th>
              <th className="text-left py-3 px-4">To&apos;lov</th>
              <th className="text-right py-3 px-4"><SortBtn field="yakuniySumma">Summa</SortBtn></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-600">
                  Ushbu davrda sotuv topilmadi
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r)}
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-gray-100 dark:border-neutral-800/50"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{formatSanaYaqin(r.sana)}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-900 dark:text-gray-100">{r.chekRaqami}</td>
                  <td className="py-3 px-4">{r.kassir.ism}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.mijoz?.ism ?? '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TOLOV_BADGE[r.tolovUsuli] ?? ''}`}>
                      {r.tolovUsuli}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatSum(r.yakuniySumma)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-neutral-800">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          Sahifa {page} / {sahifalar}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Oldingi sahifa"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Oldingi
          </button>
          <button
            type="button"
            aria-label="Keyingi sahifa"
            disabled={page >= sahifalar}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40"
          >
            Keyingi <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
