import { prisma } from './prisma'

interface StockRow {
  tovarId: string
  omborQoldiq: number
  dokonQoldiq: number
}

/**
 * SQL aggregatsiya bilan barcha tovarlar uchun qoldiqni hisoblash.
 * omborHarakati include qilish o'rniga bitta SQL query.
 *
 * Oldin: 1000 tovar × 50 harakat = 50,000 yozuv JS ga yuklanardi
 * Hozir: bitta GROUP BY query — bazada hisoblanadi
 */
export async function getStockMap(tovarIds?: string[]): Promise<Map<string, { omborQoldiq: number; dokonQoldiq: number }>> {
  const filter = tovarIds && tovarIds.length > 0
    ? `WHERE "tovarId" IN (${tovarIds.map(id => `'${id}'`).join(',')})`
    : ''

  const rows = await prisma.$queryRawUnsafe<StockRow[]>(`
    SELECT
      "tovarId",
      COALESCE(SUM(CASE
        WHEN joy = 'DOKON' THEN 0
        WHEN turi = 'KIRIM' OR turi = 'QAYTARISH' THEN miqdor
        WHEN turi = 'OTKAZMA' THEN -miqdor
        ELSE -miqdor
      END), 0)::float AS "omborQoldiq",
      COALESCE(SUM(CASE
        WHEN turi = 'OTKAZMA' THEN miqdor
        WHEN joy != 'DOKON' THEN 0
        WHEN turi = 'KIRIM' OR turi = 'QAYTARISH' THEN miqdor
        ELSE -miqdor
      END), 0)::float AS "dokonQoldiq"
    FROM ombor_harakati
    ${filter}
    GROUP BY "tovarId"
  `)

  const map = new Map<string, { omborQoldiq: number; dokonQoldiq: number }>()
  for (const r of rows) {
    map.set(r.tovarId, {
      omborQoldiq: Math.max(0, r.omborQoldiq),
      dokonQoldiq: Math.max(0, r.dokonQoldiq),
    })
  }
  return map
}
