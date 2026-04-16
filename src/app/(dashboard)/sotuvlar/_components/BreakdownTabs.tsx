'use client'

import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { formatSum } from '@/lib/utils'
import type { AnalitikaJavobi } from '../_types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const TOLOV_RANGLARI: Record<string, string> = {
  NAQD: '#16a34a',
  KARTA: '#2563eb',
  ARALASH: '#7c3aed',
  NASIYA: '#D4A017',
  SHERIK: '#6b7280',
}

const tabList = [
  ['kassirlar', 'Kassirlar'],
  ['mijozlar', 'Mijozlar'],
  ['tolov', "To'lov"],
  ['tovarlar', 'Tovarlar'],
  ['soatlar', 'Soatlar'],
] as const

interface Props {
  data: AnalitikaJavobi
  onKassirClick: (kassirId: string) => void
  onMijozClick: (mijozId: string) => void
  onTolovClick: (tolov: string) => void
}

export function BreakdownTabs({ data, onKassirClick, onMijozClick, onTolovClick }: Props) {
  const [tab, setTab] = useState<string>('kassirlar')
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 mb-4 overflow-x-auto">
          {tabList.map(([v, label]) => (
            <Tabs.Trigger
              key={v}
              value={v}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                tab === v
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
              }`}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="kassirlar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.kassirlar} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => (v / 1_000_000).toFixed(1) + 'M'} />
                  <YAxis type="category" dataKey="ism" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                    formatter={(v) => [formatSum(Number(v ?? 0)), 'Jami']}
                  />
                  <Bar dataKey="jami" fill="#DC2626" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left py-2 px-2">Ism</th>
                    <th className="text-right py-2 px-2">Soni</th>
                    <th className="text-right py-2 px-2">Jami</th>
                    <th className="text-right py-2 px-2">Foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kassirlar.map((k) => (
                    <tr
                      key={k.kassirId}
                      onClick={() => onKassirClick(k.kassirId)}
                      className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-gray-100 dark:border-neutral-800/50"
                    >
                      <td className="py-2 px-2">{k.ism}</td>
                      <td className="text-right py-2 px-2">{k.sotuvSoni}</td>
                      <td className="text-right py-2 px-2">{formatSum(k.jami)}</td>
                      <td className="text-right py-2 px-2 text-green-600 dark:text-green-400">{formatSum(k.foyda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="mijozlar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-2 px-2">Ism</th>
                  <th className="text-left py-2 px-2">Telefon</th>
                  <th className="text-right py-2 px-2">Soni</th>
                  <th className="text-right py-2 px-2">Jami</th>
                  <th className="text-right py-2 px-2">Nasiya qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {data.mijozlar.map((m) => (
                  <tr
                    key={m.mijozId}
                    onClick={() => onMijozClick(m.mijozId)}
                    className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 border-b border-gray-100 dark:border-neutral-800/50"
                  >
                    <td className="py-2 px-2">{m.ism}</td>
                    <td className="py-2 px-2 text-gray-500">{m.telefon ?? '—'}</td>
                    <td className="text-right py-2 px-2">{m.sotuvSoni}</td>
                    <td className="text-right py-2 px-2">{formatSum(m.jami)}</td>
                    <td className="text-right py-2 px-2 text-amber-600">{formatSum(m.nasiyaQoldiq)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="tolov">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.tolovUsullari} dataKey="jami" nameKey="tolovUsuli" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {data.tolovUsullari.map((t, i) => (
                      <Cell key={i} fill={TOLOV_RANGLARI[t.tolovUsuli] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                    formatter={(v) => [formatSum(Number(v ?? 0)), 'Jami']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.tolovUsullari.map((t) => (
                <button
                  key={t.tolovUsuli}
                  onClick={() => onTolovClick(t.tolovUsuli)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: TOLOV_RANGLARI[t.tolovUsuli] ?? '#6b7280' }} />
                    <span className="text-gray-800 dark:text-gray-200 text-sm">{t.tolovUsuli}</span>
                  </span>
                  <span className="text-sm">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{formatSum(t.jami)}</span>
                    <span className="text-gray-500 ml-2">{t.ulush}%</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="tovarlar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-500 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-2 px-2">Tovar</th>
                  <th className="text-right py-2 px-2">Miqdor</th>
                  <th className="text-right py-2 px-2">Jami</th>
                  <th className="text-right py-2 px-2">Foyda</th>
                </tr>
              </thead>
              <tbody>
                {data.topTovarlar.map((t) => (
                  <tr key={t.tovarId} className="border-b border-gray-100 dark:border-neutral-800/50">
                    <td className="py-2 px-2">{t.nomi}</td>
                    <td className="text-right py-2 px-2">{t.miqdor} {t.birlik.toLowerCase()}</td>
                    <td className="text-right py-2 px-2">{formatSum(t.jami)}</td>
                    <td className="text-right py-2 px-2 text-green-600">{formatSum(t.foyda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="soatlar">
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.soatlar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="soat" stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v}:00`} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + 'M'} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                  formatter={(v) => [formatSum(Number(v ?? 0)), 'Jami']}
                  labelFormatter={(v) => `${v}:00`}
                />
                <Bar dataKey="jami" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Peak soat:{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(() => {
                const max = data.soatlar.reduce((m, s) => (s.jami > m.jami ? s : m), data.soatlar[0])
                return max ? `${max.soat}:00 — ${formatSum(max.jami)}` : '—'
              })()}
            </span>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
