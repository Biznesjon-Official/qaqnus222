'use client'

import { useEffect, useState } from 'react'
import { formatSum } from '@/lib/utils'
import { TrendingUp, CreditCard, AlertTriangle, ShoppingBag, Loader2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface HisobotData {
  jamiSotuv: number
  jamiXarajat: number
  soFoyda: number
  sotuvSoni: number
  ochiqNasiyalar: number
  muddatiOtgan: number
  jamiNasiyaQarz: number
  topTovarlar: { nomi: string; jami_miqdor: number; jami_summa: number }[]
  grafikData: { sana: string; sotuv: number; sotuvSoni: number }[]
}

function StatCard({
  icon: Icon, sarlavha, qiymat, rang, iconBg, qoshimcha
}: {
  icon: React.ElementType
  sarlavha: string
  qiymat: string
  rang: string
  iconBg: string
  qoshimcha?: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-500 dark:text-gray-500 text-sm">{sarlavha}</p>
          <p className={`text-2xl font-bold mt-1 ${rang}`}>{qiymat}</p>
          {qoshimcha && <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">{qoshimcha}</p>}
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0 ml-3`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<HisobotData | null>(null)
  const [yuklanmoqda, setYuklanmoqda] = useState(true)

  useEffect(() => {
    async function yuklash() {
      try {
        const res = await fetch('/api/hisobotlar?tur=haftalik')
        const json = await res.json()
        setData(json)
      } finally {
        setYuklanmoqda(false)
      }
    }
    yuklash()
  }, [])

  if (yuklanmoqda) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 dark:text-gray-600 flex items-center gap-3">
          <Loader2 className="animate-spin w-6 h-6 text-red-500" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Stat kartalar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          sarlavha="Haftalik sotuv"
          qiymat={formatSum(data.jamiSotuv)}
          rang="text-gray-900 dark:text-gray-100"
          iconBg="bg-red-500"
          qoshimcha={`${data.sotuvSoni} ta sotuv`}
        />
        <StatCard
          icon={TrendingUp}
          sarlavha="Sof foyda"
          qiymat={formatSum(data.soFoyda)}
          rang={data.soFoyda >= 0 ? 'text-green-600' : 'text-red-600'}
          iconBg={data.soFoyda >= 0 ? 'bg-green-500' : 'bg-red-500'}
        />
        <StatCard
          icon={CreditCard}
          sarlavha="Ochiq nasiyalar"
          qiymat={`${data.ochiqNasiyalar} ta`}
          rang="text-gray-900 dark:text-gray-100"
          iconBg="bg-amber-500"
          qoshimcha={`Qarz: ${formatSum(data.jamiNasiyaQarz)}`}
        />
        <StatCard
          icon={AlertTriangle}
          sarlavha="Muddati o'tgan"
          qiymat={`${data.muddatiOtgan} ta`}
          rang="text-red-600"
          iconBg="bg-red-600"
          qoshimcha="Nasiyalar"
        />
      </div>

      {/* Grafik */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">Oxirgi 7 kunlik sotuv</h2>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.grafikData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="sotuvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="sana" stroke="#6b7280" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => (v / 1000000).toFixed(1) + 'M'}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
                labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                formatter={(value: number | undefined) => [formatSum(value ?? 0), 'Sotuv']}
              />
              <Area
                type="monotone"
                dataKey="sotuv"
                stroke="#DC2626"
                strokeWidth={2}
                fill="url(#sotuvGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tovarlar */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-4">Top sotilgan tovarlar</h2>
        {data.topTovarlar.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-center py-8">Hali sotuv yo&apos;q</p>
        ) : (
          <div className="space-y-3">
            {data.topTovarlar.map((tovar, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 dark:text-gray-200 text-sm font-medium truncate">{tovar.nomi}</p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">{tovar.jami_miqdor} dona sotildi</p>
                </div>
                <span className="text-green-600 text-sm font-semibold shrink-0">
                  {formatSum(tovar.jami_summa)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
