'use client'

import { useState } from 'react'

type Range = { dan: string; gacha: string }

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetRange(p: 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy'): Range {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  switch (p) {
    case 'bugun':
      return { dan: iso(bugun), gacha: iso(bugun) }
    case 'kecha': {
      const k = new Date(bugun); k.setDate(k.getDate() - 1)
      return { dan: iso(k), gacha: iso(k) }
    }
    case 'oxirgi7': {
      const dan = new Date(bugun); dan.setDate(dan.getDate() - 6)
      return { dan: iso(dan), gacha: iso(bugun) }
    }
    case 'shuOy': {
      const dan = new Date(bugun); dan.setDate(1)
      return { dan: iso(dan), gacha: iso(bugun) }
    }
    case 'otganOy': {
      const dan = new Date(bugun); dan.setMonth(dan.getMonth() - 1); dan.setDate(1)
      const gacha = new Date(bugun); gacha.setDate(0)
      return { dan: iso(dan), gacha: iso(gacha) }
    }
  }
}

const btnCls = (active: boolean) =>
  `px-3 py-2 rounded-xl text-sm font-medium transition ${
    active
      ? 'bg-red-600 text-white'
      : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
  }`

const inputCls =
  'px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'

export function DateRangePicker({
  dan,
  gacha,
  onChange,
}: {
  dan: string
  gacha: string
  onChange: (r: Range) => void
}) {
  const [localDan, setLocalDan] = useState(dan)
  const [localGacha, setLocalGacha] = useState(gacha)

  const presets: Array<[string, ReturnType<typeof presetRange>, 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy']> = [
    ['Bugun', presetRange('bugun'), 'bugun'],
    ['Kecha', presetRange('kecha'), 'kecha'],
    ['Oxirgi 7 kun', presetRange('oxirgi7'), 'oxirgi7'],
    ['Shu oy', presetRange('shuOy'), 'shuOy'],
    ["O'tgan oy", presetRange('otganOy'), 'otganOy'],
  ]

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map(([label, r]) => {
        const active = dan === r.dan && gacha === r.gacha
        return (
          <button key={label} onClick={() => onChange(r)} className={btnCls(active)}>
            {label}
          </button>
        )
      })}
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="sana-dan">Boshlanish sanasi</label>
        <input
          id="sana-dan"
          aria-label="Boshlanish sanasi"
          type="date"
          value={localDan}
          onChange={(e) => {
            setLocalDan(e.target.value)
            if (localGacha && e.target.value <= localGacha) onChange({ dan: e.target.value, gacha: localGacha })
          }}
          className={inputCls}
        />
        <span className="text-gray-400 dark:text-gray-600">—</span>
        <label className="sr-only" htmlFor="sana-gacha">Tugash sanasi</label>
        <input
          id="sana-gacha"
          aria-label="Tugash sanasi"
          type="date"
          value={localGacha}
          onChange={(e) => {
            setLocalGacha(e.target.value)
            if (localDan && localDan <= e.target.value) onChange({ dan: localDan, gacha: e.target.value })
          }}
          className={inputCls}
        />
      </div>
    </div>
  )
}
