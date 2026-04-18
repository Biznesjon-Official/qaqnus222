/** O'rtacha chek summasi. Soni = 0 bo'lsa 0. */
export function hisoblaOrtachaChek(jami: number, soni: number): number {
  if (soni === 0) return 0
  return jami / soni
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
