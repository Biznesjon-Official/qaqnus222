import 'dotenv/config'
import cron from 'node-cron'
import { nasiyaEslatmalarYuborish, queuedXabarlarniYuborish } from '../lib/telegram'

// ─── Cron: har kuni soat 09:00 da (Toshkent vaqti) — nasiya eslatmalar ───────

cron.schedule('0 9 * * *', async () => {
  try {
    await nasiyaEslatmalarYuborish()
  } catch (e) {
    console.error('[Scheduler] Kritik xato:', e)
  }
}, {
  timezone: 'Asia/Tashkent',
})

// ─── Cron: har 30 daqiqada — queued xabarlarni qayta yuborish ────────────────

cron.schedule('*/30 * * * *', async () => {
  try {
    await queuedXabarlarniYuborish()
  } catch (e) {
    console.error('[Queue] Kritik xato:', e)
  }
})

console.log('[Scheduler] Nasiya eslatma scheduler ishga tushdi.')
console.log('[Scheduler] Har kuni 09:00 (Toshkent vaqti) da — shaxsiy raqamdan xabar yuboriladi.')
console.log('[Scheduler] Har 30 daqiqada — queued xabarlar qayta yuboriladi.')
