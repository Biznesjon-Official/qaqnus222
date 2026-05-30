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

const SITE_URL = process.env.NEXTAUTH_URL || 'https://qaqnus222.biznesjon.uz'

function chekLinki(chekRaqami: string): string {
  return `${SITE_URL}/chek/${encodeURIComponent(chekRaqami)}`
}

// ─── Sozlamalar yuklash ──────────────────────────────────────────────────────

async function getSozlama(kalit: string): Promise<string | null> {
  const s = await prisma.sozlama.findUnique({ where: { kalit } })
  return s?.qiymat || null
}

async function isTelegramEnabled(): Promise<boolean> {
  return (await getSozlama('telegram_bildirishnoma')) !== 'false'
}

// ─── Singleton TelegramClient — bitta client qayta ishlatiladi ───────────────

let _client: TelegramClient | null = null
let _clientReady = false
let _connectPromise: Promise<TelegramClient | null> | null = null

// Entity cache — telefon raqamdan Telegram user ID ga (DB da saqlanadi)
const _entityCache = new Map<string, { userId: bigint; accessHash: bigint; cachedAt: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 soat
let _entityCacheLoaded = false

// Flood timer — PEER_FLOOD kelganda shu vaqtgacha kutish
let _floodUntil = 0

// Rate limit — xabarlar orasida minimal kutish
let _lastSendTime = 0
const MIN_SEND_INTERVAL = 3000 // 3 soniya (account-level)

// Queue worker config
const PEER_FLOOD_HOURS = 24 // PEER_FLOOD kelganda Telegram 24+ soat tutadi (3 emas)
const RETRY_BACKOFF_SECS = [30, 90, 270] // attempt 1 fail → 30s, 2 → 90s, 3 → 270s
const QUEUE_BATCH_SIZE = 5 // bir tick'da max 5 ta xabar (yetarli xajm uchun)

// Queue worker tick'i orasidagi global lock
let _queueTickRunning = false

// ─── Entity cache — DB da saqlash/yuklash ────────────────────────────────────

async function loadEntityCache(): Promise<void> {
  if (_entityCacheLoaded) return
  _entityCacheLoaded = true
  try {
    const row = await prisma.sozlama.findUnique({ where: { kalit: 'telegram_entity_cache' } })
    if (!row?.qiymat) return
    const data = JSON.parse(row.qiymat) as Record<string, { userId: string; accessHash: string; cachedAt: number }>
    const now = Date.now()
    for (const [phone, val] of Object.entries(data)) {
      if (now - val.cachedAt < CACHE_TTL) {
        _entityCache.set(phone, {
          userId: BigInt(val.userId),
          accessHash: BigInt(val.accessHash),
          cachedAt: val.cachedAt,
        })
      }
    }
    console.log(`[Telegram] Entity cache yuklandi: ${_entityCache.size} ta raqam`)
  } catch (e) {
    console.error('[Telegram] Entity cache yuklash xatosi:', e)
  }
}

async function saveEntityCache(): Promise<void> {
  try {
    const data: Record<string, { userId: string; accessHash: string; cachedAt: number }> = {}
    for (const [phone, val] of _entityCache.entries()) {
      data[phone] = { userId: val.userId.toString(), accessHash: val.accessHash.toString(), cachedAt: val.cachedAt }
    }
    await prisma.sozlama.upsert({
      where: { kalit: 'telegram_entity_cache' },
      update: { qiymat: JSON.stringify(data) },
      create: { kalit: 'telegram_entity_cache', qiymat: JSON.stringify(data) },
    })
  } catch {}
}

// ─── Flood timer — DB da saqlash/yuklash ─────────────────────────────────────

async function loadFloodTimer(): Promise<void> {
  try {
    const row = await prisma.sozlama.findUnique({ where: { kalit: 'telegram_flood_until' } })
    if (!row?.qiymat) return
    const until = parseInt(row.qiymat)
    if (until > Date.now()) {
      _floodUntil = until
      const secsLeft = Math.round((until - Date.now()) / 1000)
      console.log(`[Telegram] Flood timer yuklandi: ${secsLeft}s qoldi`)
    }
  } catch {}
}

async function saveFloodTimer(untilMs: number): Promise<void> {
  _floodUntil = untilMs
  try {
    await prisma.sozlama.upsert({
      where: { kalit: 'telegram_flood_until' },
      update: { qiymat: String(untilMs) },
      create: { kalit: 'telegram_flood_until', qiymat: String(untilMs) },
    })
  } catch {}
}

function isFlooded(): boolean {
  return _floodUntil > Date.now()
}

function floodSecsLeft(): number {
  return Math.max(0, Math.round((_floodUntil - Date.now()) / 1000))
}

async function getClient(): Promise<TelegramClient | null> {
  // Agar client tayyor bo'lsa — qaytarish
  if (_client && _clientReady) {
    try {
      // Session hali amalda ekanligini tekshirish
      if (_client.connected) return _client
      await _client.connect()
      return _client
    } catch {
      _client = null
      _clientReady = false
    }
  }

  // Agar boshqa joy allaqachon ulanmoqda bo'lsa — kutish
  if (_connectPromise) return _connectPromise

  _connectPromise = (async () => {
    try {
      const [apiId, apiHash, session] = await Promise.all([
        getSozlama('telegram_api_id'),
        getSozlama('telegram_api_hash'),
        getSozlama('telegram_session'),
      ])
      if (!apiId || !apiHash || !session) return null

      const client = new TelegramClient(
        new StringSession(session),
        parseInt(apiId),
        apiHash,
        { connectionRetries: 5, retryDelay: 1000, floodSleepThreshold: 0 }
      )

      await client.connect()
      _client = client
      _clientReady = true
      // Entity cache va flood timer DB dan yuklash
      await Promise.all([loadEntityCache(), loadFloodTimer()])
      console.log('[Telegram] Client ulandi (singleton)')
      return client
    } catch (e) {
      console.error('[Telegram] Client ulanish xatosi:', e)
      return null
    } finally {
      _connectPromise = null
    }
  })()

  return _connectPromise
}

// ─── Rate limiter ────────────────────────────────────────────────────────────

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - _lastSendTime
  if (elapsed < MIN_SEND_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_SEND_INTERVAL - elapsed))
  }
  _lastSendTime = Date.now()
}

// ─── Telefon raqam → Telegram entity resolve ────────────────────────────────

async function resolvePhone(client: TelegramClient, telefon: string): Promise<Api.TypeUser | null> {
  const cleanPhone = telefon.replace(/[\s\-()]/g, '')

  // 1. Avval cache dan qidirish
  const cached = _entityCache.get(cleanPhone)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    try {
      const inputUser = new Api.InputUser({ userId: cached.userId as any, accessHash: cached.accessHash as any })
      const result = await client.invoke(new Api.users.GetUsers({ id: [inputUser] }))
      if (result.length > 0) return result[0]
    } catch {
      _entityCache.delete(cleanPhone)
    }
  }

  // 2. ResolvePhone — kontakt SAQLAMAYDI, faqat user ID oladi
  try {
    const resolved = await client.invoke(new Api.contacts.ResolvePhone({ phone: cleanPhone }))
    if (resolved.users && resolved.users.length > 0) {
      const user = resolved.users[0] as any
      if (user.id && user.accessHash) {
        _entityCache.set(cleanPhone, {
          userId: BigInt(user.id),
          accessHash: BigInt(user.accessHash),
          cachedAt: Date.now(),
        })
        saveEntityCache().catch(() => {})
      }
      return resolved.users[0]
    }
  } catch (e: any) {
    if (e.message?.includes('PHONE_NOT_OCCUPIED')) return null
    // ResolvePhone ishlamasa — ImportContacts + darhol o'chirish
  }

  // 3. Fallback: ImportContacts, lekin darhol kontaktni o'chirish
  const result = await client.invoke(
    new Api.contacts.ImportContacts({
      contacts: [
        new Api.InputPhoneContact({
          clientId: 0 as any,
          phone: cleanPhone,
          firstName: '_',
          lastName: '',
        }),
      ],
    })
  )

  if (!result.users || result.users.length === 0) return null

  const user = result.users[0] as any

  // Kontaktni darhol o'chirish — kontaktlar ro'yxatini iflostirmaslik uchun
  if (user.id && user.accessHash) {
    const inputUser = new Api.InputUser({ userId: user.id as any, accessHash: user.accessHash as any })
    await client.invoke(new Api.contacts.DeleteContacts({ id: [inputUser] })).catch(() => {})

    _entityCache.set(cleanPhone, {
      userId: BigInt(user.id),
      accessHash: BigInt(user.accessHash),
      cachedAt: Date.now(),
    })
    // DB ga saqlash (async, kutmaymiz)
    saveEntityCache().catch(() => {})
  }

  return result.users[0]
}

// ─── Xabar yuborish (rate limited, cached, singleton) ────────────────────────

// Qaytarish turlar: ok | queued (flood, keyinroq qayta urinish) | failed (doimiy xato)
async function sendMessageToPhone(
  telefon: string,
  xabar: string
): Promise<{ ok: boolean; queued?: boolean; xato?: string }> {
  // Flood tekshiruvi
  if (isFlooded()) {
    const secs = floodSecsLeft()
    return { ok: false, queued: true, xato: `Telegram cheklovi: ${secs}s qoldi` }
  }

  try {
    const client = await getClient()
    if (!client) return { ok: false, xato: 'Telegram ulanmagan. Sozlamalardan telefon raqamni ulang.' }

    // Rate limit kutish
    await waitForRateLimit()

    const user = await resolvePhone(client, telefon)
    if (!user) {
      const cleanPhone = telefon.replace(/[\s\-()]/g, '')
      return { ok: false, xato: `${cleanPhone} raqami Telegramda topilmadi` }
    }

    await client.sendMessage(user, { message: xabar })
    return { ok: true }
  } catch (e: any) {
    const msg = e.message || String(e)

    // FloodWait — Telegram vaqtinchalik cheklovi, qayta urinish kerak
    if (msg.includes('FLOOD_WAIT') || msg.includes('FloodWait')) {
      const seconds = parseInt(msg.match(/(\d+)/)?.[1] || '3600')
      console.error(`[Telegram] FloodWait: ${seconds}s kutish kerak`)
      await saveFloodTimer(Date.now() + seconds * 1000)
      return { ok: false, queued: true, xato: `Telegram cheklovi: ${seconds}s kutish kerak` }
    }

    // PEER_FLOOD — akkaunt spam filtri.
    // Telegram bu holatda 24-72 soat saqlaydi. 3 soatda qayta urinish → yana PEER_FLOOD.
    // 24 soatga to'xtatamiz va batch'ni umuman bekor qilamiz.
    if (msg.includes('PEER_FLOOD')) {
      console.error(`[Telegram] PEER_FLOOD — akkaunt cheklandi, ${PEER_FLOOD_HOURS} soatdan keyin qayta uriniladi`)
      await saveFloodTimer(Date.now() + PEER_FLOOD_HOURS * 60 * 60 * 1000)
      return { ok: false, queued: true, xato: `Telegram spam filtri: ${PEER_FLOOD_HOURS} soatdan keyin avtomatik qayta yuboriladi` }
    }

    if (msg.includes('PHONE_NOT_OCCUPIED')) {
      return { ok: false, xato: "Bu raqam Telegramda ro'yxatdan o'tmagan" }
    }

    // Session buzilgan — client ni qayta yaratish
    if (msg.includes('AUTH_KEY') || msg.includes('SESSION_REVOKED') || msg.includes('USER_DEACTIVATED')) {
      _client = null
      _clientReady = false
      return { ok: false, xato: 'Telegram sessiya tugagan. Qayta ulaning.' }
    }

    console.error('[Telegram] Xabar yuborish xatosi:', msg)
    return { ok: false, xato: msg }
  }
}

// ─── Eski API uchun alias (legacy) ───────────────────────────────────────────
// queueWorkerTick fayl pastida aniqlangan — bu wrapper export bo'yicha
// orqaga moslik uchun mavjud. Yangi kod queueWorkerTick'ni to'g'ridan-to'g'ri chaqirsin.

export async function queuedXabarlarniYuborish(): Promise<void> {
  return queueWorkerTick()
}

// ─── Scheduler uchun — kunlik eslatma (shaxsiy raqamdan) ─────────────────────

export async function nasiyaEslatmalarYuborish() {
  if (!(await isTelegramEnabled())) return
  console.log('[Scheduler] Nasiya eslatmalar tekshirilmoqda...')

  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)

  const nasiyalar = await prisma.nasiya.findMany({
    where: {
      holati: { in: ['OCHIQ', 'MUDDATI_OTGAN'] },
      ochirilgan: false,
      muddat: { not: null },
      mijoz: { telefon: { not: null } },
    },
    include: {
      mijoz: true,
      sotuv: { select: { chekRaqami: true } },
    },
  })

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  let yuborilgan = 0
  let xatolik = 0

  for (const nasiya of nasiyalar) {
    if (!nasiya.mijoz.telefon || !nasiya.muddat) continue

    const muddat = new Date(nasiya.muddat)
    muddat.setHours(0, 0, 0, 0)
    const kunFarq = Math.round((muddat.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

    let xabarTuri: string | null = null
    let xabarMatni: string | null = null
    const chekLink = nasiya.sotuv?.chekRaqami ? `\n🔗 Chek: ${chekLinki(nasiya.sotuv.chekRaqami)}` : ''

    if (kunFarq === 3) {
      xabarTuri = '3_kun'
      xabarMatni =
        `⚠️ Nasiya eslatma\n\n` +
        `🏪 ${dokonNomi}\n` +
        `👤 ${nasiya.mijoz.ism}\n` +
        `🧾 ${nasiya.sotuv?.chekRaqami || 'Nasiya'}\n` +
        `💰 Qoldiq qarz: ${formatSum(Number(nasiya.qoldiq))}\n` +
        `📅 Muddat: ${formatSana(muddat)} (3 kun qoldi)` +
        chekLink +
        `\n\nIltimos, o'z vaqtida to'lang.`
    } else if (kunFarq === 2) {
      xabarTuri = '2_kun'
      xabarMatni =
        `⚠️ Nasiya eslatma\n\n` +
        `🏪 ${dokonNomi}\n` +
        `👤 ${nasiya.mijoz.ism}\n` +
        `🧾 ${nasiya.sotuv?.chekRaqami || 'Nasiya'}\n` +
        `💰 Qoldiq qarz: ${formatSum(Number(nasiya.qoldiq))}\n` +
        `📅 Muddat: ${formatSana(muddat)} (2 kun qoldi)` +
        chekLink +
        `\n\nIltimos, o'z vaqtida to'lang.`
    } else if (kunFarq === 1) {
      xabarTuri = '1_kun'
      xabarMatni =
        `🔴 MUHIM: Nasiya muddati ertaga!\n\n` +
        `🏪 ${dokonNomi}\n` +
        `👤 ${nasiya.mijoz.ism}\n` +
        `🧾 ${nasiya.sotuv?.chekRaqami || 'Nasiya'}\n` +
        `💰 Qoldiq qarz: ${formatSum(Number(nasiya.qoldiq))}\n` +
        `📅 Muddat: ${formatSana(muddat)} (ertaga!)` +
        chekLink +
        `\n\nIltimos, bugun to'lang!`
    } else if (kunFarq <= 0 && nasiya.holati !== 'YOPILGAN') {
      xabarTuri = 'muddati_otgan'
      const otganKun = Math.abs(kunFarq)
      xabarMatni =
        `🚨 Nasiya muddati o'tdi!\n\n` +
        `🏪 ${dokonNomi}\n` +
        `👤 ${nasiya.mijoz.ism}\n` +
        `🧾 ${nasiya.sotuv?.chekRaqami || 'Nasiya'}\n` +
        `💰 Qoldiq qarz: ${formatSum(Number(nasiya.qoldiq))}\n` +
        `📅 Muddat: ${formatSana(muddat)} (${otganKun} kun o'tdi)` +
        chekLink +
        `\n\nIltimos, tezroq to'lang.`
    }

    if (!xabarTuri || !xabarMatni) continue

    // Cross-day dedup: bu nasiya uchun shu turdagi xabar bormi?
    // (1) Bugun yaratilgan — yangi log kerak emas
    // (2) Hali yuborilmagan (pending/queued/sending) — backlog'ga yana qo'shmaymiz,
    //     aks holda xabarlar to'planib mijozni chalkashtiradi.
    // (3) Oxirgi 7 kun ichida muvaffaqiyatli yuborilgan — qaytarishga hojat yo'q
    const ettiKunOldin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const allaqachon = await prisma.bildirishnomLog.findFirst({
      where: {
        nasiyaId: nasiya.id,
        xabarTuri,
        OR: [
          { sana: { gte: bugun } },                                       // bugun yaratilgan
          { status: { in: ['pending', 'queued', 'sending'] } },           // hali yuborilmagan
          { status: 'sent', yuborilganSana: { gte: ettiKunOldin } },      // yaqinda yuborilgan
        ],
      },
    })
    if (allaqachon) continue

    // Xabar yuborish (markazlashtirilgan log bilan)
    const natija = await xabarYuborVaSaqla({
      nasiyaId: nasiya.id,
      mijozId: nasiya.mijozId,
      xabarTuri,
      xabar: xabarMatni,
      telefon: nasiya.mijoz.telefon,
    })

    if (natija.ok) {
      yuborilgan++
      console.log(`[Scheduler] Queue'ga qo'shildi: ${nasiya.mijoz.ism} (${xabarTuri})`)
    } else {
      xatolik++
      console.error(`[Scheduler] Queue xatosi: ${nasiya.mijoz.ism} — ${natija.xato}`)
    }

    // Muddati o'tganlarni yangilash
    if (kunFarq < 0 && nasiya.holati === 'OCHIQ') {
      await prisma.nasiya.update({
        where: { id: nasiya.id },
        data: { holati: 'MUDDATI_OTGAN' },
      })
    }
  }

  console.log(`[Scheduler] Yakunlandi: ${yuborilgan} yuborildi, ${xatolik} xato`)
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
      { connectionRetries: 3, floodSleepThreshold: 0 }
    )
    await client.connect()

    // GramJS ning yuqori darajadagi metodi — apiId/apiHash ni to'g'ri uzatadi
    const { phoneCodeHash } = await client.sendCode(
      { apiId, apiHash },
      phone
    )

    const tempSession = client.session.save() as unknown as string
    await prisma.sozlama.upsert({
      where: { kalit: 'telegram_temp_session' },
      update: { qiymat: tempSession },
      create: { kalit: 'telegram_temp_session', qiymat: tempSession },
    })

    return { ok: true, phoneCodeHash }
  } catch (e: any) {
    const msg = e.message || String(e)
    if (msg.includes('API_ID_INVALID')) {
      return { ok: false, xato: "API ID yoki API Hash noto'g'ri. my.telegram.org dan qayta tekshiring." }
    }
    if (msg.includes('PHONE_NUMBER_INVALID')) {
      return { ok: false, xato: "Telefon raqam noto'g'ri formatda" }
    }
    return { ok: false, xato: msg }
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
      { connectionRetries: 3, floodSleepThreshold: 0 }
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
      prisma.sozlama.deleteMany({ where: { kalit: 'telegram_temp_session' } }),
    ])

    // Singleton client ni yangilash
    _client = null
    _clientReady = false

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
  return { ulangan: !!session, telefon, foydalanuvchi }
}

// ─── Uzish ───────────────────────────────────────────────────────────────────

export async function telegramDisconnect(): Promise<{ ok: boolean }> {
  // Singleton client ni tozalash
  if (_client) {
    await _client.disconnect().catch(() => {})
    _client = null
    _clientReady = false
  }
  _entityCache.clear()

  await prisma.sozlama.deleteMany({
    where: {
      kalit: {
        in: [
          'telegram_session', 'telegram_api_id', 'telegram_api_hash',
          'telegram_phone', 'telegram_user_name', 'telegram_temp_session',
        ],
      },
    },
  })
  return { ok: true }
}

// ─── Sotuv tarkibidan mahsulotlar ro'yxatini formatlash ─────────────────────

async function getMahsulotlarMatni(sotuvId: string | null, maxQator: number = 10): Promise<string> {
  if (!sotuvId) return ''
  const tarkiblar = await prisma.sotuvTarkibi.findMany({
    where: { sotuvId },
    include: { tovar: { select: { nomi: true, birlik: true } } },
  })
  if (tarkiblar.length === 0) return ''

  const qatorlar: string[] = []
  const korsatiladigan = tarkiblar.slice(0, maxQator)
  for (const t of korsatiladigan) {
    const miqdor = Number(t.miqdor)
    const narx = Number(t.birlikNarxi)
    const birlik = t.tovar.birlik === 'DONA' ? 'dona' : t.tovar.birlik.toLowerCase()
    qatorlar.push(`  • ${t.tovar.nomi} — ${miqdor} ${birlik} × ${formatSum(narx)}`)
  }
  if (tarkiblar.length > maxQator) {
    qatorlar.push(`  ... va yana ${tarkiblar.length - maxQator} ta mahsulot`)
  }
  return '\n📦 Mahsulotlar:\n' + qatorlar.join('\n')
}

// ─── Markazlashtirilgan log: queue'ga qo'yish (yuborish darhol emas) ─────────
//
// Eski versiya darhol API'ga uradi → bir vaqtda ko'p sotuv bo'lsa burst yuboriladi.
// Yangi versiya faqat DB log yaratadi — queue worker har 5s'da 1 ta yuboradi.
// Bu shaxsiy MTProto akkaunt uchun yagona barqaror yondashuv.

async function xabarYuborVaSaqla(params: {
  nasiyaId: string | null
  mijozId: string
  xabarTuri: string
  xabar: string
  telefon: string
}): Promise<{ ok: boolean; xato?: string; logId?: string }> {
  const log = await prisma.bildirishnomLog.create({
    data: {
      nasiyaId: params.nasiyaId,
      mijozId: params.mijozId,
      xabarTuri: params.xabarTuri,
      xabarMatni: params.xabar,
      telegramTarget: params.telefon,
      status: 'pending',
      urinishSoni: 0,
      keyingiUrinish: new Date(), // darhol jo'natilishga tayyor
    },
  }).catch((e) => {
    console.error('[Telegram] Log yaratish xatosi:', e)
    return null
  })

  if (!log) return { ok: false, xato: 'Log yaratib bo\'lmadi' }
  return { ok: true, logId: log.id }
}

// ─── Queue worker: bitta tick, max QUEUE_BATCH_SIZE xabar yuboradi ──────────
//
// Pattern: pending/queued/retry holatdagi xabarlarni keyingiUrinish vaqti
// kelganda bittadan yuboradi. Rate limit (3s) + flood timer + max attempts.

export async function queueWorkerTick(): Promise<void> {
  if (_queueTickRunning) return // re-entrant himoyasi
  _queueTickRunning = true

  try {
    if (!(await isTelegramEnabled())) return

    // Eskirgan xabarlarni avtomat 'expired' qilish (max 3 kun navbatda kutadi).
    // Reminder turlari uchun: ertalabki cron ishlamasa, ertaga yangi bo'lganda yuboriladi.
    // Sotuv turlari uchun: 3 kun kechikkan tasdiq mijozni chalkashtiradi.
    const expireBeforeReminder = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 kun (eslatma uchun)
    const expireBeforeSale = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)     // 3 kun (sotuv uchun)

    const expiredReminders = await prisma.bildirishnomLog.updateMany({
      where: {
        status: { in: ['pending', 'queued'] },
        xabarTuri: { in: ['muddati_otgan', '1_kun', '2_kun', '3_kun'] },
        sana: { lt: expireBeforeReminder },
      },
      data: {
        status: 'expired',
        xato: 'Eskirgan (1 kundan ortiq) - mijozni chalkashtirmaslik uchun yuborilmadi',
        keyingiUrinish: null,
      },
    }).catch(() => ({ count: 0 }))

    const expiredSales = await prisma.bildirishnomLog.updateMany({
      where: {
        status: { in: ['pending', 'queued'] },
        xabarTuri: { in: ['nasiya_yaratildi', 'qarz_qoshildi', 'tolov_qilindi'] },
        sana: { lt: expireBeforeSale },
      },
      data: {
        status: 'expired',
        xato: 'Eskirgan (3 kundan ortiq) - mijozni chalkashtirmaslik uchun yuborilmadi',
        keyingiUrinish: null,
      },
    }).catch(() => ({ count: 0 }))

    if (expiredReminders.count + expiredSales.count > 0) {
      console.log(`[Queue] Eskirgan xabarlar: ${expiredReminders.count} eslatma + ${expiredSales.count} sotuv -> expired`)
    }

    if (isFlooded()) {
      // Flood davom etyapti — hech narsa qilmaymiz
      return
    }

    const now = new Date()
    const candidates = await prisma.bildirishnomLog.findMany({
      where: {
        status: { in: ['pending', 'queued'] },
        OR: [
          { keyingiUrinish: null },
          { keyingiUrinish: { lte: now } },
        ],
      },
      orderBy: { sana: 'asc' },
      take: QUEUE_BATCH_SIZE,
      include: { mijoz: { select: { telefon: true } } },
    })

    if (candidates.length === 0) return

    for (const log of candidates) {
      if (isFlooded()) {
        // Flood orada keldi — qolgan xabarlarni qoldiramiz
        console.log(`[Queue] Flood orada keldi, ${floodSecsLeft()}s qoldi`)
        break
      }

      const telefon = log.telegramTarget || log.mijoz?.telefon
      if (!telefon || !log.xabarMatni) {
        await prisma.bildirishnomLog.update({
          where: { id: log.id },
          data: { status: 'failed', xato: 'Telefon yoki matn yo\'q' },
        }).catch(() => {})
        continue
      }

      // 'sending' markeri — concurrent worker'lardan himoya
      await prisma.bildirishnomLog.update({
        where: { id: log.id },
        data: { status: 'sending', urinishSoni: log.urinishSoni + 1 },
      }).catch(() => {})

      const natija = await sendMessageToPhone(telefon, log.xabarMatni)

      if (natija.ok) {
        await prisma.bildirishnomLog.update({
          where: { id: log.id },
          data: {
            status: 'sent',
            yuborildi: true,
            xato: null,
            yuborilganSana: new Date(),
            keyingiUrinish: null,
          },
        }).catch(() => {})
        console.log(`[Queue] Yuborildi: ${telefon} (urinish #${log.urinishSoni + 1})`)
        continue
      }

      // Xato — turini aniqlash
      const xato = natija.xato || ''
      const isPermanentFail =
        /topilmadi|not found|ro'yxatdan o'tmagan|PHONE_NOT_OCCUPIED/i.test(xato)
      const isFloodErr = natija.queued === true

      if (isPermanentFail) {
        // PHONE_NOT_OCCUPIED — qayta urinmaymiz, darhol failed
        await prisma.bildirishnomLog.update({
          where: { id: log.id },
          data: {
            status: 'failed',
            xato: xato.slice(0, 500),
            keyingiUrinish: null,
          },
        }).catch(() => {})
        console.warn(`[Queue] Failed (permanent): ${telefon} — ${xato.slice(0, 80)}`)
        continue
      }

      if (isFloodErr) {
        // Flood — bu xabarni queued holatda qoldirib, urinishSoni'ni -1 qilamiz
        // (bu urinish hisobga olinmaydi — bir nechta retry'da failure'ga ketmaslik uchun).
        await prisma.bildirishnomLog.update({
          where: { id: log.id },
          data: {
            status: 'queued',
            urinishSoni: log.urinishSoni, // qaytarib qo'yamiz
            xato: xato.slice(0, 500),
            keyingiUrinish: new Date(_floodUntil),
          },
        }).catch(() => {})
        console.warn(`[Queue] Flood: ${telefon} — keyingi urinish ${floodSecsLeft()}s dan keyin`)
        break // qolgan xabarlarni hozir urinmaymiz
      }

      // Transient xato — exponential backoff bilan retry
      const attempt = log.urinishSoni + 1 // increment qilingan urinishSoni
      const maxAttempts = log.maxUrinish || 3

      if (attempt >= maxAttempts) {
        await prisma.bildirishnomLog.update({
          where: { id: log.id },
          data: {
            status: 'failed',
            xato: xato.slice(0, 500),
            keyingiUrinish: null,
          },
        }).catch(() => {})
        console.error(`[Queue] Failed after ${attempt} attempts: ${telefon} — ${xato.slice(0, 80)}`)
        continue
      }

      const backoffIdx = Math.min(attempt - 1, RETRY_BACKOFF_SECS.length - 1)
      const backoffSecs = RETRY_BACKOFF_SECS[backoffIdx]
      const nextRetry = new Date(Date.now() + backoffSecs * 1000)

      await prisma.bildirishnomLog.update({
        where: { id: log.id },
        data: {
          status: 'queued',
          xato: xato.slice(0, 500),
          keyingiUrinish: nextRetry,
        },
      }).catch(() => {})
      console.log(`[Queue] Retry #${attempt}/${maxAttempts} for ${telefon} in ${backoffSecs}s`)
    }
  } catch (e) {
    console.error('[Queue] Tick xatosi:', e)
  } finally {
    _queueTickRunning = false
  }
}

// ─── Bildirishnoma funksiyalari ──────────────────────────────────────────────

export async function nasiyaYaratildiXabarToliq(
  nasiyaId: string,
  mijozId: string,
  data: { chekRaqami: string; summasi: number; qoldiqQarz: number; muddat?: Date | null; mijozIsm?: string; sotuvId?: string | null }
) {
  if (!(await isTelegramEnabled())) return

  const mijoz = await prisma.mijoz.findUnique({ where: { id: mijozId } })
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  const mahsulotlarMatni = await getMahsulotlarMatni(data.sotuvId || null)

  const xabar =
    `📋 Yangi nasiya ochildi\n\n` +
    `🏪 ${dokonNomi}\n` +
    `👤 Mijoz: ${data.mijozIsm || mijoz.ism}\n` +
    `🧾 Chek: ${data.chekRaqami}\n` +
    mahsulotlarMatni +
    `\n💰 Summa: ${formatSum(data.summasi)}\n` +
    `📊 Qoldiq qarz: ${formatSum(data.qoldiqQarz)}\n` +
    (data.muddat ? `📅 Muddat: ${formatSana(data.muddat)}\n` : '') +
    `\n🔗 Chek: ${chekLinki(data.chekRaqami)}\n` +
    `\nIltimos, o'z vaqtida to'lang.`

  return xabarYuborVaSaqla({
    nasiyaId,
    mijozId,
    xabarTuri: 'nasiya_yaratildi',
    xabar,
    telefon: mijoz.telefon,
  })
}

export async function qarzQoshildiXabar(nasiyaId: string, mijozId: string, summasi: number, yangiQoldiq: number) {
  if (!(await isTelegramEnabled())) return

  const [mijoz, nasiya] = await Promise.all([
    prisma.mijoz.findUnique({ where: { id: mijozId } }),
    prisma.nasiya.findUnique({ where: { id: nasiyaId }, include: { sotuv: { select: { chekRaqami: true } } } }),
  ])
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  const chekLink = nasiya?.sotuv?.chekRaqami ? `\n🔗 Chek: ${chekLinki(nasiya.sotuv.chekRaqami)}` : ''

  const xabar =
    `📦 Yangi qarz qo'shildi\n\n` +
    `🏪 ${dokonNomi}\n` +
    `👤 Mijoz: ${mijoz.ism}\n` +
    `💰 Qo'shilgan summa: ${formatSum(summasi)}\n` +
    `📊 Jami qoldiq qarz: ${formatSum(yangiQoldiq)}\n` +
    chekLink +
    `\nIltimos, o'z vaqtida to'lang.`

  return xabarYuborVaSaqla({
    nasiyaId,
    mijozId,
    xabarTuri: 'qarz_qoshildi',
    xabar,
    telefon: mijoz.telefon,
  })
}

export async function tolovQilindiXabar(nasiyaId: string, mijozId: string, tolovSummasi: number, qoldiq: number) {
  if (!(await isTelegramEnabled())) return

  const [mijoz, nasiya] = await Promise.all([
    prisma.mijoz.findUnique({ where: { id: mijozId } }),
    prisma.nasiya.findUnique({ where: { id: nasiyaId }, include: { sotuv: { select: { chekRaqami: true } } } }),
  ])
  if (!mijoz?.telefon) return

  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  const yopildi = qoldiq <= 0
  const chekLink = nasiya?.sotuv?.chekRaqami ? `\n🔗 Chek: ${chekLinki(nasiya.sotuv.chekRaqami)}` : ''

  const xabar = yopildi
    ? `✅ Nasiya to'liq to'landi!\n\n🏪 ${dokonNomi}\n👤 Mijoz: ${mijoz.ism}\n💳 To'langan: ${formatSum(tolovSummasi)}\n📊 Qoldiq: 0 so'm${chekLink}\n\nRahmat, nasiyangiz yopildi! ✅`
    : `💳 To'lov qabul qilindi\n\n🏪 ${dokonNomi}\n👤 Mijoz: ${mijoz.ism}\n💳 To'langan: ${formatSum(tolovSummasi)}\n📊 Qoldiq qarz: ${formatSum(qoldiq)}${chekLink}\n\nRahmat!`

  return xabarYuborVaSaqla({
    nasiyaId,
    mijozId,
    xabarTuri: 'tolov_qilindi',
    xabar,
    telefon: mijoz.telefon,
  })
}

export async function testXabarYuborish(telefon: string): Promise<{ ok: boolean; xato?: string }> {
  const dokonNomi = (await getSozlama('dokon_nomi')) || "Do'kon"
  const xabar = `✅ Test xabar\n\n🏪 ${dokonNomi}\n\nTelegram bildirishnomalar muvaffaqiyatli ishlayapti!`
  return sendMessageToPhone(telefon, xabar)
}

// ─── Qayta yuborish (resend) ─────────────────────────────────────────────────

export async function xabarQaytaYuborish(logId: string): Promise<{ ok: boolean; xato?: string }> {
  const log = await prisma.bildirishnomLog.findUnique({
    where: { id: logId },
    include: { mijoz: true },
  })
  if (!log) return { ok: false, xato: 'Xabar topilmadi' }
  if (!log.xabarMatni) return { ok: false, xato: 'Xabar matni saqlanmagan' }

  const telefon = log.telegramTarget || log.mijoz.telefon
  if (!telefon) return { ok: false, xato: "Mijozda telefon raqam yo'q" }

  // Queue'ga qaytarish — worker keyingi tick'da yuboradi.
  // Counter va xato'ni reset qilamiz (foydalanuvchi qayta urinishni so'radi).
  await prisma.bildirishnomLog.update({
    where: { id: logId },
    data: {
      status: 'pending',
      xato: null,
      urinishSoni: 0,
      keyingiUrinish: new Date(),
      telegramTarget: telefon,
    },
  }).catch(() => {})

  // Darhol tick chaqiramiz — agar boshqa worker ishlamayotgan bo'lsa
  queueWorkerTick().catch(() => {})

  return { ok: true }
}

// ─── Qo'lda yangi xabar yuborish (manual) ────────────────────────────────────

export async function qolbolaXabarYuborish(mijozId: string, matn: string): Promise<{ ok: boolean; xato?: string }> {
  const mijoz = await prisma.mijoz.findUnique({ where: { id: mijozId } })
  if (!mijoz?.telefon) return { ok: false, xato: "Mijozda telefon raqam yo'q" }

  return xabarYuborVaSaqla({
    nasiyaId: null,
    mijozId,
    xabarTuri: 'qolbola',
    xabar: matn,
    telefon: mijoz.telefon,
  })
}
