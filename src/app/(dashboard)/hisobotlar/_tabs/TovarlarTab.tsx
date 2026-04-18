'use client'

import { formatSum } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useReportData } from '../_hooks/useReportData'
import type { ReportTur } from '@/lib/hisobotlar'

interface AbcTovar {
  tovarId: string
  nomi: string
  jami_summa: number
  jami_miqdor: number
  ulushi: number
  sinf: 'A' | 'B' | 'C'
}

interface DeadStockTovar {
  tovarId: string
  nomi: string
  qoldiq: number
  birlik: string
  oxirgiSotuv: string | null
  kunlarSon: number
}

interface AbcResponse {
  tovarlar: AbcTovar[]
  jamiSotuv: number
}

interface DeadStockResponse {
  tovarlar: DeadStockTovar[]
}

interface Props {
  filtrlar: { tur: ReportTur; dan: string; gacha: string; [key: string]: unknown }
  isKassir: boolean
}

const SINF_RANG: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  C: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400',
}

export function TovarlarTab({ filtrlar }: Props) {
  const abc = useReportData<AbcResponse>('/api/hisobotlar/abc', filtrlar)
  const dead = useReportData<DeadStockResponse>('/api/hisobotlar/dead-stock', filtrlar)

  const yuklanmoqda = abc.yuklanmoqda || dead.yuklanmoqda

  if (yuklanmoqda) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-600 gap-3">
        <Loader2 className="animate-spin w-6 h-6 text-red-500" />
        <span>Yuklanmoqda...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ABC tahlil */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold">ABC tahlil</h2>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
            A — top 80% daromad, B — keyingi 15%, C — qolgan 5%
          </p>
        </div>

        {!abc.data || abc.data.tovarlar.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-center py-8">
            Ma&apos;lumot yo&apos;q
          </p>
        ) : (
          <>
            {/* Summary chips */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {(['A', 'B', 'C'] as const).map((sinf) => {
                const count = abc.data!.tovarlar.filter((t) => t.sinf === sinf).length
                return (
                  <div
                    key={sinf}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${SINF_RANG[sinf]}`}
                  >
                    {sinf} — {count} ta tovar
                  </div>
                )
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-neutral-800">
                    <th className="text-left pb-3 text-gray-500 dark:text-gray-500 font-medium">
                      Tovar
                    </th>
                    <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                      Sotuv
                    </th>
                    <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                      Ulush
                    </th>
                    <th className="text-center pb-3 text-gray-500 dark:text-gray-500 font-medium">
                      Sinf
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                  {abc.data.tovarlar.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                        {t.nomi}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatSum(t.jami_summa)}
                      </td>
                      <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">
                        {t.ulushi.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${SINF_RANG[t.sinf]}`}
                        >
                          {t.sinf}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Dead stock */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold">Dead Stock</h2>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-0.5">
            30+ kun sotilmagan tovarlar
          </p>
        </div>

        {!dead.data || dead.data.tovarlar.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 text-center py-8">
            Dead stock topilmadi
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800">
                  <th className="text-left pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Tovar
                  </th>
                  <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Qoldiq
                  </th>
                  <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Oxirgi sotuv
                  </th>
                  <th className="text-right pb-3 text-gray-500 dark:text-gray-500 font-medium">
                    Kunlar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                {dead.data.tovarlar.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                      {t.nomi}
                    </td>
                    <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">
                      {t.qoldiq} {t.birlik}
                    </td>
                    <td className="py-2.5 text-right text-gray-500 dark:text-gray-500">
                      {t.oxirgiSotuv ?? '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`text-xs font-semibold ${
                          t.kunlarSon > 60
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {t.kunlarSon} kun
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
