import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const holati = searchParams.get('holati') || ''
    const mijozId = searchParams.get('mijozId') || ''

    const where: any = {}
    if (holati) where.holati = holati
    if (mijozId) where.mijozId = mijozId

    // Muddati o'tganlarni avtomatik yangilash
    await prisma.nasiya.updateMany({
      where: {
        holati: 'OCHIQ',
        muddat: { lt: new Date() },
      },
      data: { holati: 'MUDDATI_OTGAN' },
    })

    const nasiyalar = await prisma.nasiya.findMany({
      where,
      include: {
        mijoz: true,
        sotuv: { select: { chekRaqami: true, sana: true } },
        tolovlar: { orderBy: { sana: 'desc' } },
      },
      orderBy: { sana: 'desc' },
    })

    return NextResponse.json(nasiyalar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const body = await req.json()
    const { ism, manzil, telefon, qarz, muddat } = body

    if (!ism || !manzil || !qarz || !muddat) {
      return NextResponse.json({ xato: 'Ism, manzil, qarz va muddat majburiy' }, { status: 400 })
    }

    // Mijozni topish yoki yaratish
    let mijoz = await prisma.mijoz.findFirst({
      where: { ism, manzil },
    })

    if (!mijoz) {
      mijoz = await prisma.mijoz.create({
        data: {
          ism,
          manzil,
          telefon: telefon || null,
        },
      })
    } else if (telefon && mijoz.telefon !== telefon) {
      mijoz = await prisma.mijoz.update({
        where: { id: mijoz.id },
        data: { telefon },
      })
    }

    const nasiya = await prisma.nasiya.create({
      data: {
        mijozId: mijoz.id,
        jamiQarz: qarz,
        qoldiq: qarz,
        muddat: new Date(muddat),
      },
    })

    return NextResponse.json(nasiya, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
