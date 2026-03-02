import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateChekRaqami } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const dan = searchParams.get('dan')
    const gacha = searchParams.get('gacha')
    const chekRaqami = searchParams.get('chekRaqami')

    // Chek raqami bo'yicha qidirish (qaytarish uchun)
    if (chekRaqami) {
      const sotuv = await prisma.sotuv.findUnique({
        where: { chekRaqami },
        include: {
          mijoz: { select: { ism: true, telefon: true } },
          kassir: { select: { ism: true } },
          tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true } } } },
          nasiya: true,
        },
      })
      return NextResponse.json(sotuv ? { sotuvlar: [sotuv], jami: 1 } : { sotuvlar: [], jami: 0 })
    }

    const where: any = {}
    if (dan || gacha) {
      where.sana = {}
      if (dan) where.sana.gte = new Date(dan)
      if (gacha) {
        const gachaD = new Date(gacha)
        gachaD.setHours(23, 59, 59)
        where.sana.lte = gachaD
      }
    }

    const [sotuvlar, jami] = await Promise.all([
      prisma.sotuv.findMany({
        where,
        include: {
          mijoz: { select: { ism: true, telefon: true } },
          kassir: { select: { ism: true } },
          sherikDokon: { select: { nomi: true } },
          tarkiblar: {
            include: { tovar: { select: { nomi: true, birlik: true } } },
          },
          nasiya: true,
        },
        orderBy: { sana: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sotuv.count({ where }),
    ])

    return NextResponse.json({ sotuvlar, jami, page, limit })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const data = await req.json()
    const kassirId = (session.user as any).id

    // Tranzaksiya: sotuv + ombor harakati + nasiya
    const sotuv = await prisma.$transaction(async (tx) => {
      // 1. Sotuv yaratish
      const yangiSotuv = await tx.sotuv.create({
        data: {
          chekRaqami: generateChekRaqami(),
          mijozId: data.mijozId || null,
          sherikDokonId: data.sherikDokonId || null,
          jamiSumma: parseFloat(data.jamiSumma),
          chegirma: parseFloat(data.chegirma || 0),
          yakuniySumma: parseFloat(data.yakuniySumma),
          tolovUsuli: data.tolovUsuli,
          naqdTolangan: parseFloat(data.naqdTolangan || 0),
          kartaTolangan: parseFloat(data.kartaTolangan || 0),
          kassirId,
        },
      })

      // 2. Sotuv tarkiblarini kiritish va omborni kamaytirish
      for (const item of data.tarkiblar) {
        await tx.sotuvTarkibi.create({
          data: {
            sotuvId: yangiSotuv.id,
            tovarId: item.tovarId,
            miqdor: parseFloat(item.miqdor),
            birlikNarxi: parseFloat(item.birlikNarxi),
            chegirma: parseFloat(item.chegirma || 0),
            jami: parseFloat(item.jami),
          },
        })

        // Ombor harakati - chiqim
        await tx.omborHarakati.create({
          data: {
            tovarId: item.tovarId,
            turi: 'CHIQIM',
            miqdor: parseFloat(item.miqdor),
            narx: parseFloat(item.birlikNarxi),
            sotuvId: yangiSotuv.id,
            izoh: `Sotuv: ${yangiSotuv.chekRaqami}`,
            foydalanuvchiId: kassirId,
          },
        })
      }

      // 3. Sherikdan olish (agar stock yetishmasa)
      if (data.sherikdanOlishlar && Array.isArray(data.sherikdanOlishlar)) {
        for (const so of data.sherikdanOlishlar) {
          let sherikId = so.sherikId
          // Yangi sherik yaratish
          if (!sherikId && so.yangiSherikIsm) {
            const yangiSherik = await tx.sherik.create({
              data: { ism: so.yangiSherikIsm, telefon: so.yangiSherikTelefon || null }
            })
            sherikId = yangiSherik.id
          }
          if (sherikId) {
            await tx.sherikdanOlish.create({
              data: {
                sotuvId: yangiSotuv.id,
                sherikId,
                tovarId: so.tovarId,
                miqdor: parseFloat(so.miqdor),
                narx: parseFloat(so.narx),
                jami: parseFloat(so.miqdor) * parseFloat(so.narx),
                izoh: so.izoh || null,
              }
            })
          }
        }
      }

      // 4. Nasiya yaratish (agar nasiya bo'lsa)
      if (data.tolovUsuli === 'NASIYA' && data.mijozId) {
        await tx.nasiya.create({
          data: {
            sotuvId: yangiSotuv.id,
            mijozId: data.mijozId,
            jamiQarz: parseFloat(data.yakuniySumma),
            tolangan: 0,
            qoldiq: parseFloat(data.yakuniySumma),
            muddat: data.nasiyaMuddat ? new Date(data.nasiyaMuddat) : null,
          },
        })
      }

      return yangiSotuv
    })

    const toliSotuv = await prisma.sotuv.findUnique({
      where: { id: sotuv.id },
      include: {
        tarkiblar: { include: { tovar: true } },
        mijoz: true,
        kassir: { select: { ism: true, telefon: true } },
        nasiya: true,
      },
    })

    return NextResponse.json(toliSotuv, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Sotuv amalga oshmadi' }, { status: 500 })
  }
}
