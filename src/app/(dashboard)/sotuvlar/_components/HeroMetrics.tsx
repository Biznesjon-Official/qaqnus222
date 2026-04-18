'use client'

import { formatSum } from '@/lib/utils'
import { ShoppingBag, TrendingUp, Receipt, Sparkles } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  jamiSotuv: number
  sotuvSoni: number
  ortachaChek: number
  jamiFoyda: number
  kunlikGrafik: Array<{ sana: string; sotuv: number }>
}

export function HeroMetrics(props: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Hero metric (2x) */}
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 dark:text-gray-500 text-xs uppercase tracking-wider">JAMI SOTUV</p>
            <p className="text-gray-900 dark:text-gray-100 text-3xl lg:text-4xl font-bold mt-2">
              {formatSum(props.jamiSotuv)}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shrink-0 ml-4">
            <ShoppingBag size={22} className="text-white" />
          </div>
        </div>
        {/* Sparkline */}
        <div className="h-12 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={props.kunlikGrafik}>
              <Line
                type="monotone"
                dataKey="sotuv"
                stroke="#DC2626"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ergash metriclar */}
      <div className="grid grid-rows-3 gap-4">
        <SmallMetric
          ikonka={TrendingUp}
          sarlavha="Sotuvlar"
          qiymat={`${props.sotuvSoni} ta`}
          iconBg="bg-blue-500"
        />
        <SmallMetric
          ikonka={Receipt}
          sarlavha="O'rtacha chek"
          qiymat={formatSum(props.ortachaChek)}
          iconBg="bg-amber-500"
        />
        <SmallMetric
          ikonka={Sparkles}
          sarlavha="Sof foyda"
          qiymat={formatSum(props.jamiFoyda)}
          iconBg={props.jamiFoyda >= 0 ? 'bg-green-500' : 'bg-red-500'}
        />
      </div>
    </div>
  )
}

function SmallMetric({
  ikonka: Ikonka,
  sarlavha,
  qiymat,
  iconBg,
}: {
  ikonka: React.ElementType
  sarlavha: string
  qiymat: string
  iconBg: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-500 dark:text-gray-500 text-xs">{sarlavha}</p>
          <p className="text-gray-900 dark:text-gray-100 text-lg font-bold mt-1">{qiymat}</p>
        </div>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0 ml-3`}>
          <Ikonka size={16} className="text-white" />
        </div>
      </div>
    </div>
  )
}
