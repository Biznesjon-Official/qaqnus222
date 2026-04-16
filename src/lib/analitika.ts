/** Ikki davr orasidagi foizli o'zgarish. Eski = 0 bo'lsa null. */
export function hisoblaFoiz(yangi: number, eski: number): number | null {
  if (eski === 0) return null
  const foiz = ((yangi - eski) / eski) * 100
  return Math.round(foiz * 10) / 10
}

/** O'rtacha chek summasi. Soni = 0 bo'lsa 0. */
export function hisoblaOrtachaChek(jami: number, soni: number): number {
  if (soni === 0) return 0
  return jami / soni
}

/**
 * Joriy davrga teng uzunlikdagi oldingi davr.
 *
 * Kiritilgan `dan` va `gacha` sanalari LOCAL vaqt sifatida talqin qilinadi
 * (yoki faqat kalendar sana ma'lumoti olinadi). Qaytariladigan sanalar esa
 * UTC-yarim tuni / UTC-kun oxiri sifatida qurilgan. Demak, chiqish sanalarini
 * `.toISOString().slice(0, 10)` orqali o'qish kerak; `.toLocaleDateString()`
 * server timezone'iga qarab boshqa sana berishi mumkin.
 *
 * @example
 * const { dan, gacha } = oldingiDavrOlish(
 *   new Date('2026-04-01T00:00:00'),
 *   new Date('2026-04-16T23:59:59')
 * )
 * dan.toISOString().slice(0, 10)   // "2026-03-16"
 * gacha.toISOString().slice(0, 10) // "2026-03-31"
 */
export function oldingiDavrOlish(dan: Date, gacha: Date): { dan: Date; gacha: Date } {
  // Use local calendar dates (getFullYear/Month/Date) and build results as UTC
  // so toISOString().slice(0,10) reflects the same calendar date in any timezone.
  const danY = dan.getFullYear()
  const danM = dan.getMonth()
  const danD = dan.getDate()
  const gachaY = gacha.getFullYear()
  const gachaM = gacha.getMonth()
  const gachaD = gacha.getDate()

  const danUTC = Date.UTC(danY, danM, danD)
  const gachaUTC = Date.UTC(gachaY, gachaM, gachaD)
  const kunlar = Math.round((gachaUTC - danUTC) / (1000 * 60 * 60 * 24)) + 1

  // oldingiGacha = dan - 1 day (as UTC midnight, display as end-of-day)
  const oldingiGachaUTC = danUTC - 1000 * 60 * 60 * 24
  const gD = new Date(oldingiGachaUTC)
  const oldingiGacha = new Date(Date.UTC(gD.getUTCFullYear(), gD.getUTCMonth(), gD.getUTCDate(), 23, 59, 59, 999))

  // oldingiDan = oldingiGacha - (kunlar - 1) days
  const oldingiDanUTC = oldingiGachaUTC - (kunlar - 1) * 1000 * 60 * 60 * 24
  const dD = new Date(oldingiDanUTC)
  const oldingiDan = new Date(Date.UTC(dD.getUTCFullYear(), dD.getUTCMonth(), dD.getUTCDate(), 0, 0, 0, 0))

  return { dan: oldingiDan, gacha: oldingiGacha }
}

/**
 * Sotuvlarni 0-23 soatga guruhlash (mahalliy vaqt zonasi bo'yicha).
 *
 * Do'kon ish soatlariga mos keladigan analitika uchun `getHours()` ishlatiladi,
 * ya'ni mahalliy vaqt zonasi. UTC emas — chunki foydalanuvchi "14:00 da eng ko'p
 * sotuv" deb ko'rganda, u mahalliy vaqtni anglaydi.
 */
export function soatTaqsimoti(
  sotuvlar: Array<{ sana: Date; yakuniySumma: number }>
): Array<{ soat: number; sotuvSoni: number; jami: number }> {
  const natija = Array.from({ length: 24 }, (_, soat) => ({
    soat,
    sotuvSoni: 0,
    jami: 0,
  }))
  for (const s of sotuvlar) {
    const h = s.sana.getHours()
    natija[h].sotuvSoni += 1
    natija[h].jami += s.yakuniySumma
  }
  return natija
}
