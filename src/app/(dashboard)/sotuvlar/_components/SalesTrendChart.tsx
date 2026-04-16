'use client'

import {
  Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatSum } from '@/lib/utils'

interface Props {
  data: Array<{ sana: string; sotuv: number; sotuvSoni: number; oldingiSotuv: number }>
}

export function SalesTrendChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold">Sotuv dinamikasi</h2>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">Shu davr</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-gray-400 dark:bg-gray-600" />
            <span className="text-gray-600 dark:text-gray-400">Oldingi davr</span>
          </span>
        </div>
      </div>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="sotuvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="sana"
              stroke="#6b7280"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + 'M'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#f9fafb',
              }}
              formatter={(v: string | number | undefined, name: string | undefined) => {
                const nameMap: Record<string, string> = { sotuv: 'Shu davr', oldingiSotuv: 'Oldingi davr' }
                const key = name ?? ''
                return [formatSum(Number(v ?? 0)), nameMap[key] ?? key] as [string, string]
              }}
            />
            <Area
              type="monotone"
              dataKey="sotuv"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#sotuvGrad)"
            />
            <Line
              type="monotone"
              dataKey="oldingiSotuv"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
