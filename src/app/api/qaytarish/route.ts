import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const dan = searchParams.get('dan')
    const gacha = searchParams.get('gacha')

    const where: any = {}
    if (dan || gacha) {
      where.yaratilgan = {}
      if (dan) where.yaratilgan.gte = new Date(dan)
      if (gacha) {
        const g = new Date(gacha)
        g.setHours(23, 59, 59)
        where.yaratilgan.lte = g
      }
    }

    const qaytarishlar = await prisma.qaytarish.findMany({
      where,
      include: {
        aslSotuv: { select: { chekRaqami: true } },
        kassir: { select: { ism: true } },
        tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true } } } },
      },
      orderBy: { yaratilgan: 'desc' },
    })

    return NextResponse.json(qaytarishlar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const kassirId = (session.user as any).id
    const { aslSotuvId, tarkiblar, sabab } = await req.json()

    if (!aslSotuvId || !tarkiblar || tarkiblar.length === 0) {
      return NextResponse.json({ xato: "Ma'lumotlar to'liq emas" }, { status: 400 })
    }

    const jamiSumma = tarkiblar.reduce((s: number, t: any) => s + parseFloat(t.jami), 0)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Qaytarish yaratish
      const qaytarish = await tx.qaytarish.create({
        data: {
          aslSotuvId,
          kassirId,
          jamiSumma,
          sabab: sabab || null,
          tarkiblar: {
            create: tarkiblar.map((t: any) => ({
              tovarId: t.tovarId,
              miqdor: parseFloat(t.miqdor),
              birlikNarxi: parseFloat(t.birlikNarxi),
              jami: parseFloat(t.jami),
            })),
          },
        },
      })

      // 2. Har tovar uchun QAYTARISH harakati (qoldiq ortadi)
      for (const t of tarkiblar) {
        await tx.omborHarakati.create({
          data: {
            tovarId: t.tovarId,
            turi: 'QAYTARISH',
            miqdor: parseFloat(t.miqdor),
            narx: parseFloat(t.birlikNarxi),
            sotuvId: aslSotuvId,
            izoh: `Qaytarish: ${sabab || ''}`.trim(),
            foydalanuvchiId: kassirId,
          },
        })
      }

      // 3. Agar asl sotuvda nasiya bo'lsa → nasiya qoldiqni kamaytirish
      const nasiya = await tx.nasiya.findUnique({ where: { sotuvId: aslSotuvId } })
      if (nasiya) {
        const yangiTolangan = Number(nasiya.tolangan) + jamiSumma
        const yangiQoldiq = Number(nasiya.jamiQarz) - yangiTolangan
        const yangiHolat = yangiQoldiq <= 0 ? 'YOPILGAN' : nasiya.holati
        await tx.nasiya.update({
          where: { id: nasiya.id },
          data: {
            tolangan: yangiTolangan,
            qoldiq: Math.max(0, yangiQoldiq),
            holati: yangiHolat,
          },
        })
      }

      return qaytarish
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Qaytarish amalga oshmadi' }, { status: 500 })
  }
}
