import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { computeCheck } from 'telegram/Password'
import { prisma } from './prisma'

// ─── Yordamchi funksiyalar ───────────────────────────────────────────────────

function formatSum(sum: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(sum)) + " so'm"
}

function formatSana(d: Date) {
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Sozlamalar yuklash ──────────────────────────────────────────────────────

async function getSozlama(kalit: string): Promise<string | null> {
  const s = await prisma.sozlama.findUnique({ where: { kalit } })
  return s?.qiymat || null
}

async function isTelegramEnabled(): Promise<boolean> {
  return (await getSozlama('telegram_bildirishnoma')) !== 'false'
}

async function getTelegramCredentials() {
  const [apiId, apiHash, session] = await Promise.all([
    getSozlama('telegram_api_id'),
    getSozlama('telegram_api_hash'),
    getSozlama('telegram_session'),
  ])
  if (!apiId || !apiHash || !session) return null
  return { apiId: parseInt(apiId), apiHash, session }
}

// ─── GramJS client yaratish ──────────────────────────────────────────────────

async function createClient(): Promise<TelegramClient | null> {
  const creds = await getTelegramCredentials()
  if (!creds) return null

  const client = new TelegramClient(
    new StringSession(creds.session),
    creds.apiId,
    creds.apiHash,
    { connectionRetries: 3 }
  )

  await client.connect()
  return client
}

// ─── Telefon raqam bo'yicha xabar yuborish ───────────────────────────────────

async function sendMessageToPhone(
  telefon: string,
  xabar: string
): Promise<{ ok: boolean; xato?: string }> {
  let client: TelegramClient | null = null
  try {
    client = await createClient()
    if (!client) return { ok: false, xato: 'Telegram ulanmagan. Sozlamalardan telefon raqamni ulang.' }

    // Telefon raqamni tozalash (+998901234567 formatga)
    const cleanPhone = telefon.replace(/[\s\-()]/g, '')

    // Kontaktni import qilish orqali foydalanuvchini topish
    const result = await client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId: 0 as any,
            phone: cleanPhone,
            firstName: 'Mijoz',
            lastName: '',
          }),
        ],
      })
    )

    if (!result.users || result.users.length === 0) {
      return { ok: false, xato: `${cleanPhone} raqami Telegram da topilmadi` }
    }

    const user = result.users[0]
    await client.sendMessage(user, { message: xabar })

    return { ok: true }
  } catch (e: any) {
    const msg = e.message || String(e)
    if (msg.includes('FLOOD_WAIT')) {
      const seconds = msg.match(/(\d+)/)?.[1] || '?'
      return { ok: false, xato: `Telegram cheklovi: ${seconds} soniya kutish kerak` }
    }
    if (msg.includes('PHONE_NOT_OCCUPIED')) {
      return { ok: false, xato: 'Bu raqam Telegram da ro\'yxatdan o\'tmagan' }
    }
    return { ok: false, xato: msg }
  } finally {
    if (client) {
      await client.disconnect().catch(() => {})
    }
  }
}

// ─── Ulanish (kod yuborish) ──────────────────────────────────────────────────

export async function telegramConnect(apiId: number, apiHash: string, phone: string): Promise<{
  ok: boolean
  phoneCodeHash?: string
  xato?: string
}> {
  let client: TelegramClient | null = null
  try {
    client = new TelegramClient(
      new StringSession(''),
      apiId,
      apiHash,
      { connectionRetries: 3 }
    )
    await client.connect()

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({} as any),
      })
    )

    // Vaqtinchalik sessionni saqlash (kod tasdiqlash uchun kerak)
    const tempSession = client.session.save() as unknown as string
    await prisma.sozlama.upsert({
      where: { kalit: 'telegram_temp_session' },
      update: { qiymat: tempSession },
      create: { kalit: 'telegram_temp_session', qiymat: tempSession },
    })

    return { ok: true, phoneCodeHash: (result as any).phoneCodeHash }
  } catch (e: any) {
    return { ok: false, xato: e.message || String(e) }
  } finally {
    if (client) await client.disconnect().catch(() => {})
  }
}

// ─── Kodni tasdiqlash ────────────────────────────────────────────────────────

export async function telegramVerify(
  apiId: number,
  apiHash: string,
  phone: string,
  code: string,
  phoneCodeHash: string,
  password?: string
): Promise<{ ok: boolean; xato?: string }> {
  let client: TelegramClient | null = null
  try {
    const tempSession = await getSozlama('telegram_temp_session')
    client = new TelegramClient(
      new StringSession(tempSession || ''),
      apiId,
      apiHash,
      { connectionRetries: 3 }
    )
    await client.connect()

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode: code,
        })
      )
    } catch (e: any) {
      // 2FA parol kerak
      if (e.message?.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) {
          return { ok: false, xato: '2FA parol kiritish kerak' }
        }
        const srpPassword = await client.invoke(new Api.account.GetPassword())
        const srpResult = await computeCheck(srpPassword, password)
        await client.invoke(new Api.auth.CheckPassword({ password: srpResult }))
      } else {
        throw e
      }
    }

    // Muvaffaqiyatli — session va ma'lumotlarni saqlash
    const sessionStr = client.session.save() as unknown as string
    const me = await client.getMe()

    await Promise.all([
      prisma.sozlama.upsert({
        where: { kalit: 'telegram_session' },
        update: { qiymat: sessionStr },
        create: { kalit: 'telegram_session', qiymat: sessionStr },
      }),
      prisma.sozlama.upsert({
        where: { kalit: 'telegram_api_id' },
        update: { qiymat: String(apiId) },
        create: { kalit: 'telegram_api_id', qiymat: String(apiId) },
      }),
      prisma.sozlama.upsert({
        where: { kalit: 'telegram_api_hash' },
        update: { qiymat: apiHash },
        create: { kalit: 'telegram_api_hash', qiymat: apiHash },
      }),
      prisma.sozlama.upsert({
        where: { kalit: 'telegram_phone' },
        update: { qiymat: phone },
        create: { kalit: 'telegram_phone', qiymat: phone },
      }),
      prisma.sozlama.upsert({
        where: { kalit: 'telegram_user_name' },
        update: { qiymat: `${(me as any).firstName || ''} ${(me as any).lastName || ''}`.trim() },
        create: { kalit: 'telegram_user_name', qiymat: `${(me as any).firstName || ''} ${(me as any).lastName || ''}`.trim() },
      }),
      // Temp session tozalash
      prisma.sozlama.deleteMany({ where: { kalit: 'telegram_temp_session' } }),
    ])

    return { ok: true }
  } catch (e: any) {
    return { ok: false, xato: e.message || String(e) }
  } finally {
    if (client) await client.disconnect().catch(() => {})
  }
}

// ─── Telegram holati ─────────────────────────────────────────────────────────

export async function telegramStatus(): Promise<{
  ulangan: boolean
  telefon: string | null
  foydalanuvchi: string | null
}> {
  const [telefon, foydalanuvchi, session] = await Promise.all([
    getSozlama('telegram_phone'),
    getSozlama('telegram_user_name'),
    getSozlama('telegram_session'),
  ])
  return {
    ulangan: !!session,
    telefon,
    foydalanuvchi,
  }
}

// ─── Uzish ───────────────────────────────────────────────────────────────────

export async function telegramDisconnect(): Promise<{ ok: boolean }> {
  await prisma.sozlama.deleteMany({
    where: {
      kalit: {
        in: [
          'telegram_session',
          'telegram_api_id',
          'telegram_api_hash',
          'telegram_phone',
          'telegram_user_name',
          'telegram_temp_session',
        ],
      },
    },
  })
  return { ok: true }
}

// ─── Bildirishnoma funksiyalari ──────────────────────────────────────────────

export async function nasiyaYaratildiXabarToliq(
  nasiyaId: string,
  mijozId: string,
  data: { chekRaqami: string; summasi: number; qoldiqQarz: number; muddat?: Date | null; mijozIsm?: string }
) {
  if (!(await isTelegramEnabled())) return

  const mijoz = await prisma.mijoz.findUnique({ where: { id: mijozId } })
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"

  const xabar =
    `📋 Yangi nasiya ochildi\n\n` +
    `🏪 ${dokonNomi}\n` +
    `👤 Mijoz: ${data.mijozIsm || mijoz.ism}\n` +
    `🧾 Chek: ${data.chekRaqami}\n` +
    `💰 Summa: ${formatSum(data.summasi)}\n` +
    `📊 Qoldiq qarz: ${formatSum(data.qoldiqQarz)}\n` +
    (data.muddat ? `📅 Muddat: ${formatSana(data.muddat)}\n` : '') +
    `\nIltimos, o'z vaqtida to'lang.`

  const natija = await sendMessageToPhone(mijoz.telefon, xabar)

  await prisma.bildirishnomLog.create({
    data: {
      nasiyaId,
      mijozId,
      xabarTuri: 'nasiya_yaratildi',
      yuborildi: natija.ok,
      xato: natija.xato,
    },
  }).catch(() => {})

  return natija
}

export async function qarzQoshildiXabar(
  nasiyaId: string,
  mijozId: string,
  summasi: number,
  yangiQoldiq: number
) {
  if (!(await isTelegramEnabled())) return

  const mijoz = await prisma.mijoz.findUnique({ where: { id: mijozId } })
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"

  const xabar =
    `📦 Yangi qarz qo'shildi\n\n` +
    `🏪 ${dokonNomi}\n` +
    `👤 Mijoz: ${mijoz.ism}\n` +
    `💰 Qo'shilgan summa: ${formatSum(summasi)}\n` +
    `📊 Jami qoldiq qarz: ${formatSum(yangiQoldiq)}\n` +
    `\nIltimos, o'z vaqtida to'lang.`

  const natija = await sendMessageToPhone(mijoz.telefon, xabar)

  await prisma.bildirishnomLog.create({
    data: {
      nasiyaId,
      mijozId,
      xabarTuri: 'qarz_qoshildi',
      yuborildi: natija.ok,
      xato: natija.xato,
    },
  }).catch(() => {})

  return natija
}

export async function tolovQilindiXabar(
  nasiyaId: string,
  mijozId: string,
  tolovSummasi: number,
  qoldiq: number
) {
  if (!(await isTelegramEnabled())) return

  const mijoz = await prisma.mijoz.findUnique({ where: { id: mijozId } })
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  const yopildi = qoldiq <= 0

  const xabar = yopildi
    ? (
      `✅ Nasiya to'liq to'landi!\n\n` +
      `🏪 ${dokonNomi}\n` +
      `👤 Mijoz: ${mijoz.ism}\n` +
      `💳 To'langan: ${formatSum(tolovSummasi)}\n` +
      `📊 Qoldiq: 0 so'm\n\n` +
      `Rahmat, nasiyangiz yopildi! ✅`
    )
    : (
      `💳 To'lov qabul qilindi\n\n` +
      `🏪 ${dokonNomi}\n` +
      `👤 Mijoz: ${mijoz.ism}\n` +
      `💳 To'langan: ${formatSum(tolovSummasi)}\n` +
      `📊 Qoldiq qarz: ${formatSum(qoldiq)}\n` +
      `\nRahmat!`
    )

  const natija = await sendMessageToPhone(mijoz.telefon, xabar)

  await prisma.bildirishnomLog.create({
    data: {
      nasiyaId,
      mijozId,
      xabarTuri: 'tolov_qilindi',
      yuborildi: natija.ok,
      xato: natija.xato,
    },
  }).catch(() => {})

  return natija
}

export async function testXabarYuborish(telefon: string): Promise<{ ok: boolean; xato?: string }> {
  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"

  const xabar =
    `✅ Test xabar\n\n` +
    `🏪 ${dokonNomi}\n\n` +
    `Telegram bildirishnomalar muvaffaqiyatli ishlayapti!`

  return sendMessageToPhone(telefon, xabar)
}
