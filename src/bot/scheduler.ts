import 'dotenv/config'
import cron from 'node-cron'
import { nasiyaEslatmalarYuborish, queueWorkerTick } from '../lib/telegram'

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

// ─── Queue worker — har 5 soniyada 1 ta tick ────────────────────────────────
// Pattern: sotuv/qarz/tolov endpointlari xabarni queue'ga qo'yadi (DB).
// Bu worker DB'dan pending/queued xabarlarni olib, har 5s'da bittadan yuboradi.
// Rate limit, flood timer, exponential backoff hammasi queueWorkerTick ichida.

const WORKER_INTERVAL_MS = 5000

let _stopped = false

async function workerLoop() {
  while (!_stopped) {
    try {
      await queueWorkerTick()
    } catch (e) {
      console.error('[Queue worker] Kritik xato:', e)
    }
    await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL_MS))
  }
}

// Graceful shutdown
process.on('SIGTERM', () => { _stopped = true })
process.on('SIGINT', () => { _stopped = true })

workerLoop()

console.log('[Scheduler] Telegram scheduler ishga tushdi.')
console.log('[Scheduler] Har kuni 09:00 (Toshkent) — nasiya eslatmalar queue\'ga qo\'shiladi.')
console.log(`[Queue worker] Har ${WORKER_INTERVAL_MS / 1000}s'da pending xabarlar tekshiriladi va birma-bir yuboriladi.`)
