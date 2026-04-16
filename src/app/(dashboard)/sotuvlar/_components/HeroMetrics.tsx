'use client'

import { formatSum } from '@/lib/utils'
import { hisoblaFoiz } from '@/lib/analitika'
import { ShoppingBag, TrendingUp, Receipt, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  jamiSotuv: number
  sotuvSoni: number
  ortachaChek: number
  jamiFoyda: number
  oldingiDavr: {
    jamiSotuv: number
    sotuvSoni: number
    ortachaChek: number
    jamiFoyda: number
  }
  kunlikGrafik: Array<{ sana: string; sotuv: number }>
}

function Trend({
  yangi,
  eski,
  yaxshiYuqori = true,
  testId,
}: {
  yangi: number
  eski: number
  yaxshiYuqori?: boolean
  testId?: string
}) {
  const foiz = hisoblaFoiz(yangi, eski)
  if (foiz === null) {
    return (
      <span data-testid={testId} className="text-xs text-gray-400 dark:text-gray-600">
        —
      </span>
    )
  }
  const ijobiy = yaxshiYuqori ? foiz >= 0 : foiz <= 0
  const rang = ijobiy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const Ikonka = foiz >= 0 ? ArrowUp : ArrowDown
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1 text-xs font-medium ${rang}`}>
      <Ikonka size={12} strokeWidth={3} aria-hidden />
      <span>{foiz >= 0 ? '▲' : '▼'}</span>
      {foiz > 0 ? '+' : ''}
      {foiz.toFixed(1)}%
    </span>
  )
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
            <div className="mt-2">
              <Trend yangi={props.jamiSotuv} eski={props.oldingiDavr.jamiSotuv} testId="jamiSotuv-trend" />
              <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">o'tgan davrga nisbatan</span>
            </div>
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
          trend={<Trend yangi={props.sotuvSoni} eski={props.oldingiDavr.sotuvSoni} />}
          iconBg="bg-blue-500"
        />
        <SmallMetric
          ikonka={Receipt}
          sarlavha="O'rtacha chek"
          qiymat={formatSum(props.ortachaChek)}
          trend={<Trend yangi={props.ortachaChek} eski={props.oldingiDavr.ortachaChek} />}
          iconBg="bg-amber-500"
        />
        <SmallMetric
          ikonka={Sparkles}
          sarlavha="Sof foyda"
          qiymat={formatSum(props.jamiFoyda)}
          trend={<Trend yangi={props.jamiFoyda} eski={props.oldingiDavr.jamiFoyda} />}
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
  trend,
  iconBg,
}: {
  ikonka: React.ElementType
  sarlavha: string
  qiymat: string
  trend: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-500 dark:text-gray-500 text-xs">{sarlavha}</p>
          <p className="text-gray-900 dark:text-gray-100 text-lg font-bold mt-1">{qiymat}</p>
          <div className="mt-1">{trend}</div>
        </div>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0 ml-3`}>
          <Ikonka size={16} className="text-white" />
        </div>
      </div>
    </div>
  )
}
