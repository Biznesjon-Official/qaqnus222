/**
 * Telegram xabar yuborish xatolarini foydalanuvchi tushunadigan
 * qisqa Uzbek etiketlarga aylantirish.
 *
 * Manba: bildirishnomLog.xato maydoni (src/lib/telegram.ts dan kelgan
 * xato xabarlari). Bu kategorizator UI'da rangli badge ko'rsatish va
 * qaytarib yuborish (resend) tugmasini ko'rsatish/yashirish uchun
 * ishlatiladi.
 *
 * Severity ma'nosi:
 *  - 'permanent': abadiy xato (qayta urinish foydasiz; mijoz Telegram'da yo'q)
 *  - 'transient': vaqtinchalik (avtomat qayta urinishlar yordam beradi)
 *  - 'unknown':   sabab aniq emas (admin tekshirishi kerak)
 *
 * MUHIM: Bu funksiya CHISTA — DB, network yoki I/O ga tegmaydi.
 * Faqat string pattern match qiladi. Konservativ — agar pattern
 * mos kelmasa "Boshqa xato" qaytaradi.
 */

export interface XatoInfo {
  /** UI'da ko'rinadigan 1-3 so'zli Uzbek etiket */
  shortLabel: string
  /** Asl to'liq xato matni (tooltip yoki "batafsil" ko'rsatish uchun) */
  fullText: string
  /** Xato turi: permanent (abadiy), transient (vaqtinchalik), unknown */
  severity: 'permanent' | 'transient' | 'unknown'
  /** Badge rangi — UI komponenti shu ranglardan birini ishlatishi kerak */
  color: 'red' | 'orange' | 'yellow' | 'gray'
}

/**
 * Pattern qoidalar ro'yxati. Tartib MUHIM: birinchi mos kelgan
 * pattern g'olib bo'ladi. Aniqroq pattern'lar yuqorida turishi shart
 * (masalan, "spam filtri" "cheklov"dan oldin).
 *
 * Har bir pattern case-insensitive (`i` flag) — telegram.ts da xato
 * matnlari turli registr bo'lishi mumkin (MTProto raw vs formatlangan).
 */
const QOIDALAR: ReadonlyArray<{
  pattern: RegExp
  shortLabel: string
  severity: XatoInfo['severity']
  color: XatoInfo['color']
}> = [
  // ─── Cache-only rejim — navbatda kutmoqda (eng aniq, eng oldin) ───────
  // telegram.ts:836 da yoziladi: "Cache-only rejim - keyingi cycle'da yuboriladi"
  {
    pattern: /cache[- ]only|keyingi cycle/i,
    shortLabel: 'Kutmoqda',
    severity: 'transient',
    color: 'gray',
  },

  // ─── PEER_FLOOD / spam filtri (aniqroq — "cheklov"dan oldin) ──────────
  // telegram.ts:346 "Telegram spam filtri: ..."
  // telegram.ts:343 raw "PEER_FLOOD"
  {
    pattern: /spam filtri|peer[_ ]?flood/i,
    shortLabel: 'Spam cheklov',
    severity: 'transient',
    color: 'orange',
  },

  // ─── FloodWait / Telegram cheklovi (umumiyroq) ────────────────────────
  // telegram.ts:311 "Telegram cheklovi: 23s qoldi"
  // telegram.ts:337 "Telegram cheklovi: 3600s kutish kerak"
  // Raw MTProto: "FLOOD_WAIT_NNN" yoki "FloodWaitError"
  {
    pattern: /telegram cheklovi|flood[_ ]?wait/i,
    shortLabel: 'Spam cheklov',
    severity: 'transient',
    color: 'orange',
  },

  // ─── Sessiya tugagan (aniqroq — "ulanmagan"dan oldin) ─────────────────
  // telegram.ts:357 "Telegram sessiya tugagan. Qayta ulaning."
  // Raw MTProto: "AUTH_KEY_*", "SESSION_REVOKED", "USER_DEACTIVATED"
  {
    pattern: /sessiya tugagan|auth[_ ]?key|session[_ ]?revoked|user[_ ]?deactivated/i,
    shortLabel: 'Sessiya tugagan',
    severity: 'unknown',
    color: 'yellow',
  },

  // ─── Telegram ulanmagan (sozlamadan ulash kerak) ──────────────────────
  // telegram.ts:316 "Telegram ulanmagan. Sozlamalardan telefon raqamni ulang."
  {
    pattern: /ulanmagan|sozlamalardan/i,
    shortLabel: 'Ulanmagan',
    severity: 'unknown',
    color: 'yellow',
  },

  // ─── PHONE_NOT_OCCUPIED — mijoz Telegram'da yo'q (raw MTProto) ───────
  // telegram.ts:350 "Bu raqam Telegramda ro'yxatdan o'tmagan"
  {
    pattern: /ro['’ʼ]yxatdan o['’ʼ]tmagan|phone[_ ]?not[_ ]?occupied/i,
    shortLabel: 'Telegram yo‘q',
    severity: 'permanent',
    color: 'red',
  },

  // ─── "raqami Telegramda topilmadi" — eng ko'p uchraydigan holat ───────
  // telegram.ts:324 `${cleanPhone} raqami Telegramda topilmadi`
  // Lekin avval malformed phone'larni ushlash kerak (pastdagi qoidalar
  // bu qoidadan oldin tekshirilmaydi chunki "raqami Telegramda topilmadi"
  // patterni umumiy; malformed tekshirish raqamga qaratilgan).
  // Shu sababli malformed pattern shu yerda — `topilmadi` so'zidan oldin —
  // tekshiriladi, ammo asl xato matni "topilmadi" bilan kelganligi sababli
  // ikkala bo'lim ham bir xil "topilmadi" ni o'z ichiga oladi. Yechim:
  // avval phone qismini ajratib olib alohida pattern bilan tekshirish.
  // Pastdagi maxsus malformed-pattern shu vazifani bajaradi.
  {
    // "+998" tagi raqamsiz (faqat prefiks): "+998 raqami Telegramda topilmadi"
    // yoki "+998raqami..." — \D+ orqali ham bo'lishi mumkin.
    pattern: /^\+?998\s*raqami\s+telegramda\s+topilmadi/i,
    shortLabel: 'Noto‘g‘ri raqam',
    severity: 'permanent',
    color: 'red',
  },
  {
    // "+998" prefiksi bilan boshlanmagan raqam: "919778939 raqami Telegramda topilmadi"
    // Pattern: boshida + yo'q va 998 ham yo'q, lekin raqamlar bilan boshlanadi.
    pattern: /^(?!\+?998)\d+\s+raqami\s+telegramda\s+topilmadi/i,
    shortLabel: 'Noto‘g‘ri raqam',
    severity: 'permanent',
    color: 'red',
  },
  {
    // Asosiy "raqami Telegramda topilmadi" — to'g'ri formatdagi raqam,
    // shunchaki mijozda Telegram yo'q (eng ko'p uchraydigan holat).
    pattern: /raqami\s+telegramda\s+topilmadi|not\s+found/i,
    shortLabel: 'Telegram yo‘q',
    severity: 'permanent',
    color: 'red',
  },
]

/**
 * Telegram xato matnini tahlil qilib, foydalanuvchi tushunadigan
 * qisqa etiket va severity qaytaradi.
 *
 * @param xato — bildirishnomLog.xato (string | null | undefined)
 * @returns XatoInfo yoki null (xato bo'sh bo'lsa)
 *
 * Konservativ qoida: agar pattern mos kelmasa "Boshqa xato" qaytaradi
 * (severity: 'unknown', color: 'gray'). Bu admin'ga tooltip orqali to'liq
 * xato matnini ko'rish imkonini beradi.
 */
export function xatonyTahlil(xato: string | null | undefined): XatoInfo | null {
  // Bo'sh / null / undefined / faqat whitespace — null qaytaramiz
  // (xato yo'q degani — UI badge ham ko'rsatmaydi).
  if (xato == null) return null
  const trimmed = String(xato).trim()
  if (trimmed.length === 0) return null

  // Birinchi mos kelgan qoida g'olib (tartib QOIDALAR'da muhim)
  for (const qoida of QOIDALAR) {
    if (qoida.pattern.test(trimmed)) {
      return {
        shortLabel: qoida.shortLabel,
        fullText: trimmed,
        severity: qoida.severity,
        color: qoida.color,
      }
    }
  }

  // Hech qaysi pattern mos kelmadi — konservativ "Boshqa xato"
  return {
    shortLabel: 'Boshqa xato',
    fullText: trimmed,
    severity: 'unknown',
    color: 'gray',
  }
}
