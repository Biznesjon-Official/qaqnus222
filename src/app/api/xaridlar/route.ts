import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const taminotchiId = searchParams.get('taminotchiId') || ''
    const dan = searchParams.get('dan') || ''
    const gacha = searchParams.get('gacha') || ''

    const where: any = {}
    if (taminotchiId) where.taminotchiId = taminotchiId
    if (dan || gacha) {
      where.sana = {}
      if (dan) where.sana.gte = new Date(dan)
      if (gacha) {
        const g = new Date(gacha)
        g.setHours(23, 59, 59, 999)
        where.sana.lte = g
      }
    }

    const xaridlar = await prisma.xarid.findMany({
      where,
      include: {
        taminotchi: { select: { id: true, nomi: true } },
        tarkiblar: true,
        foydalanuvchi: { select: { ism: true } },
      },
      orderBy: { sana: 'desc' },
    })

    return NextResponse.json(xaridlar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const foydalanuvchiId = (session.user as any).id
    const data = await req.json()

    const { taminotchiId, tarkiblar, tolangan, izoh } = data

    if (!tarkiblar || tarkiblar.length === 0) {
      return NextResponse.json({ xato: 'Kamida bitta tovar kiriting' }, { status: 400 })
    }

    const jamiSumma = tarkiblar.reduce(
      (sum: number, t: { miqdor: number; birlikNarxi: number }) =>
        sum + Number(t.miqdor) * Number(t.birlikNarxi),
      0
    )
    const tolanganSumma = Number(tolangan) || 0
    const qoldiqQarz = jamiSumma - tolanganSumma

    const xarid = await prisma.xarid.create({
      data: {
        taminotchiId: taminotchiId || null,
        jamiSumma,
        tolangan: tolanganSumma,
        qoldiqQarz,
        izoh: izoh || null,
        foydalanuvchiId,
        tarkiblar: {
          create: tarkiblar.map((t: { tovarNomi: string; miqdor: number; birlikNarxi: number }) => ({
            tovarNomi: t.tovarNomi,
            miqdor: Number(t.miqdor),
            birlikNarxi: Number(t.birlikNarxi),
            jami: Number(t.miqdor) * Number(t.birlikNarxi),
          })),
        },
      },
      include: {
        taminotchi: { select: { nomi: true } },
        tarkiblar: true,
      },
    })

    return NextResponse.json(xarid, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
