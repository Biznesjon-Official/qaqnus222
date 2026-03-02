import 'dotenv/config'
import cron from 'node-cron'
import { Bot } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN env variable kerak!')

const bot = new Bot(BOT_TOKEN)

function formatSum(sum: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(sum)) + " so'm"
}

function formatSana(d: Date) {
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function escMd(text: string) {
  return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&')
}

// ─── Nasiya ogohlantirish funksiyasi ─────────────────────────────────────────

async function nasiyaOgohlantirishlar() {
  console.log('[Scheduler] Nasiya tekshirilmoqda...')
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)

  const nasiyalar = await prisma.nasiya.findMany({
    where: {
      holati: { in: ['OCHIQ', 'MUDDATI_OTGAN'] },
      mijoz: { telegram_id: { not: null } },
      muddat: { not: null },
    },
    include: {
      mijoz: true,
      sotuv: { select: { chekRaqami: true } },
    },
  })

  for (const nasiya of nasiyalar) {
    if (!nasiya.mijoz.telegram_id || !nasiya.muddat) continue

    const muddat = new Date(nasiya.muddat)
    muddat.setHours(0, 0, 0, 0)
    const kunFarq = Math.round((muddat.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

    let xabarTuri: string | null = null
    let xabarMatni: string | null = null

    if (kunFarq === 3) {
      xabarTuri = '3_kun'
      xabarMatni = `⚠️ *Nasiya eslatma*\n\nSalom, *${escMd(nasiya.mijoz.ism)}*\\!\n\nChek: \`${escMd(nasiya.sotuv.chekRaqami)}\`\nQoldiq qarz: *${escMd(formatSum(Number(nasiya.qoldiq)))}*\nMuddat: *${escMd(formatSana(muddat))}* \\(3 kun qoldi\\)`
    } else if (kunFarq === 2) {
      xabarTuri = '2_kun'
      xabarMatni = `⚠️ *Nasiya eslatma*\n\nSalom, *${escMd(nasiya.mijoz.ism)}*\\!\n\nChek: \`${escMd(nasiya.sotuv.chekRaqami)}\`\nQoldiq qarz: *${escMd(formatSum(Number(nasiya.qoldiq)))}*\nMuddat: *${escMd(formatSana(muddat))}* \\(2 kun qoldi\\)`
    } else if (kunFarq === 1) {
      xabarTuri = '1_kun'
      xabarMatni = `🔴 *MUHIM: Nasiya muddati ertaga\\!*\n\nSalom, *${escMd(nasiya.mijoz.ism)}*\\!\n\nChek: \`${escMd(nasiya.sotuv.chekRaqami)}\`\nQoldiq qarz: *${escMd(formatSum(Number(nasiya.qoldiq)))}*\nMuddat: *${escMd(formatSana(muddat))}* \\(ertaga\\!\\)`
    } else if (kunFarq <= 0 && nasiya.holati !== 'YOPILGAN') {
      xabarTuri = 'muddati_otgan'
      const otganKun = Math.abs(kunFarq)
      xabarMatni = `🚨 *Nasiya muddati o'tdi\\!*\n\nSalom, *${escMd(nasiya.mijoz.ism)}*\\!\n\nChek: \`${escMd(nasiya.sotuv.chekRaqami)}\`\nQoldiq qarz: *${escMd(formatSum(Number(nasiya.qoldiq)))}*\nMuddat: *${escMd(formatSana(muddat))}* \\(${otganKun} kun o'tdi\\)\n\nIltimos, tezroq to'lang\\.`
    }

    if (!xabarTuri || !xabarMatni) continue

    // Bugun allaqachon xabar yuborilganmi?
    const yuborilgan = await prisma.bildirishnomLog.findFirst({
      where: {
        nasiyaId: nasiya.id,
        xabarTuri,
        sana: { gte: bugun },
      },
    })
    if (yuborilgan) continue

    // Xabar yuborish
    let yuborildi = false
    let xato: string | undefined
    try {
      await bot.api.sendMessage(nasiya.mijoz.telegram_id, xabarMatni, { parse_mode: 'MarkdownV2' })
      yuborildi = true
      console.log(`[Scheduler] Xabar yuborildi: ${nasiya.mijoz.ism} (${xabarTuri})`)
    } catch (e: any) {
      xato = e.message
      console.error(`[Scheduler] Xabar yuborishda xato (${nasiya.mijoz.ism}):`, e.message)
    }

    // Log yozish
    await prisma.bildirishnomLog.create({
      data: {
        nasiyaId: nasiya.id,
        mijozId: nasiya.mijozId,
        xabarTuri,
        yuborildi,
        xato,
      },
    })

    // Muddati o'tganlarni yangilash
    if (kunFarq < 0 && nasiya.holati === 'OCHIQ') {
      await prisma.nasiya.update({
        where: { id: nasiya.id },
        data: { holati: 'MUDDATI_OTGAN' },
      })
    }
  }

  console.log('[Scheduler] Tekshiruv yakunlandi.')
}

// ─── Cron: har kuni soat 09:00 da ────────────────────────────────────────────

cron.schedule('0 9 * * *', nasiyaOgohlantirishlar, {
  timezone: 'Asia/Tashkent',
})

console.log('[Scheduler] Nasiya ogohlantirish scheduler ishga tushdi.')
console.log('[Scheduler] Har kuni 09:00 (Toshkent vaqti) da ishlaydi.')
