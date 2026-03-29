import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const holati = searchParams.get('holati') || 'KUTILMOQDA'

    const buyurtmalar = await prisma.buyurtma.findMany({
      where: holati === 'BARCHASI' ? {} : { holati: holati as any },
      include: {
        sotuvchi: { select: { id: true, ism: true } },
        mijoz: { select: { id: true, ism: true, telefon: true } },
        tarkiblar: {
          include: { tovar: { select: { id: true, nomi: true, birlik: true } } }
        }
      },
      orderBy: { yaratilgan: 'desc' },
    })

    return NextResponse.json(buyurtmalar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const rol = (session.user as any).rol
    if (rol !== 'SOTUVCHI' && rol !== 'ADMIN' && rol !== 'KASSIR') {
      return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 })
    }

    const { tarkiblar, izoh, mijozId } = await req.json()
    if (!tarkiblar || tarkiblar.length === 0) {
      return NextResponse.json({ xato: 'Savat bo\'sh' }, { status: 400 })
    }

    const jamiSumma = tarkiblar.reduce((s: number, t: any) => s + Number(t.jami), 0)

    const buyurtma = await prisma.buyurtma.create({
      data: {
        sotuvchiId: (session.user as any).id,
        mijozId: mijozId || null,
        jamiSumma,
        izoh: izoh || null,
        tarkiblar: {
          create: tarkiblar.map((t: any) => ({
            tovarId: t.tovarId,
            miqdor: t.miqdor,
            birlikNarxi: t.birlikNarxi,
            jami: t.jami,
          }))
        }
      },
      include: {
        sotuvchi: { select: { id: true, ism: true } },
        mijoz: { select: { id: true, ism: true, telefon: true } },
        tarkiblar: {
          include: { tovar: { select: { id: true, nomi: true, birlik: true } } }
        }
      }
    })

    return NextResponse.json(buyurtma, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
