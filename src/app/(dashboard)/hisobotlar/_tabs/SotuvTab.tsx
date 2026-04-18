'use client'

import { formatSum } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useReportData } from '../_hooks/useReportData'
import type { ReportTur } from '@/lib/hisobotlar'

interface SoatData {
  soat: number
  sotuv: number
  sotuvSoni: number
}

interface KunlikData {
  sana: string
  sotuv: number
  sotuvSoni: number
}

interface SotuvResponse {
  soatlar: SoatData[]
  kunlik: KunlikData[]
  jamiSotuv: number
  sotuvSoni: number
}

interface Props {
  filtrlar: { tur: ReportTur; dan: string; gacha: string; [key: string]: unknown }
  isKassir: boolean
}

export function SotuvTab({ filtrlar, isKassir }: Props) {
  const { data, yuklanmoqda } = useReportData<SotuvResponse>('/api/hisobotlar/soatlar', filtrlar)

  if (yuklanmoqda) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600 gap-3">
        <Loader2 className="animate-spin w-6 h-6 text-red-500" />
        <span>Yuklanmoqda...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-8 text-center">
        <p className="text-gray-400 dark:text-gray-600">Ma&apos;lumot topilmadi</p>
      </div>
    )
  }

  // Peak soat aniqlash
  const peakSoat = data.soatlar.length > 0
    ? data.soatlar.reduce((prev, curr) => (curr.sotuv > prev.sotuv ? curr : prev))
    : null

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs">Jami sotuv</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {formatSum(data.jamiSotuv)}
          </p>
          <p className="text-gray-400 dark:text-gray-600 text-xs">{data.sotuvSoni} ta sotuv</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
          <p className="text-gray-500 dark:text-gray-500 text-xs">Peak soat</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {peakSoat !== null ? `${peakSoat.soat}:00` : '—'}
          </p>
          <p className="text-gray-400 dark:text-gray-600 text-xs">
            {peakSoat !== null ? formatSum(peakSoat.sotuv) : ''}
          </p>
        </div>
      </div>

      {/* Soatlik heatmap (bar chart) */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
          Soatlik sotuv (peak hours)
        </h2>
        {data.soatlar.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-center py-8">
            Ma&apos;lumot yo&apos;q
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.soatlar}
                margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="soat"
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}:00`}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v / 1000000).toFixed(1) + 'M'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#f9fafb',
                  }}
                  labelFormatter={(label) => `${label}:00 — ${Number(label) + 1}:00`}
                  formatter={(v: number | undefined) => [formatSum(v ?? 0), 'Sotuv']}
                />
                <Bar dataKey="sotuv" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Kunlik sotuv grafigi */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
          Kunlik sotuv dinamikasi
        </h2>
        {data.kunlik.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-center py-8">
            Ma&apos;lumot yo&apos;q
          </p>
        ) : (
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.kunlik}
                margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="sana" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v / 1000000).toFixed(1) + 'M'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#f9fafb',
                  }}
                  formatter={(v: number | undefined) => [formatSum(v ?? 0), 'Sotuv']}
                />
                <Bar dataKey="sotuv" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* KASSIR ko'ra olmaydi — yashirin info */}
      {!isKassir && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
            Kunlik tafsilot
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800">
                  <th className="text-left pb-3 text-gray-500 dark:text-gray-500 font-medium">Sana</th>
                  <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Sotuvlar
                  </th>
                  <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Summa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                {data.kunlik.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-gray-700 dark:text-gray-300">{row.sana}</td>
                    <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">
                      {row.sotuvSoni} ta
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatSum(row.sotuv)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
