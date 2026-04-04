import 'dotenv/config'
import cron from 'node-cron'
import { nasiyaEslatmalarYuborish } from '../lib/telegram'

// ─── Cron: har kuni soat 09:00 da (Toshkent vaqti) ──────────────────────────

cron.schedule('0 9 * * *', async () => {
  try {
    await nasiyaEslatmalarYuborish()
  } catch (e) {
    console.error('[Scheduler] Kritik xato:', e)
  }
}, {
  timezone: 'Asia/Tashkent',
})

console.log('[Scheduler] Nasiya eslatma scheduler ishga tushdi.')
console.log('[Scheduler] Har kuni 09:00 (Toshkent vaqti) da — shaxsiy raqamdan xabar yuboriladi.')
