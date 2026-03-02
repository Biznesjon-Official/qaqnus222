import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sherikId = searchParams.get('sherikId')

    const qarzlar = await prisma.sherikQarz.findMany({
      where: sherikId ? { sherikId } : {},
      include: { tarkiblar: true },
      orderBy: { yaratilgan: 'desc' },
    })

    return NextResponse.json(qarzlar)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { sherikId, izoh, tarkiblar } = await req.json()
    if (!sherikId) return NextResponse.json({ xato: 'Sherik tanlanmagan' }, { status: 400 })
    if (!tarkiblar?.length) return NextResponse.json({ xato: 'Mahsulotlar kiritilmagan' }, { status: 400 })

    const qarz = await prisma.sherikQarz.create({
      data: {
        sherikId,
        izoh: izoh || null,
        tarkiblar: {
          create: tarkiblar.map((t: { tovarNomi: string; miqdor: number; birlik: string }) => ({
            tovarNomi: t.tovarNomi,
            miqdor: t.miqdor,
            birlik: t.birlik || 'dona',
          })),
        },
      },
      include: { tarkiblar: true },
    })

    return NextResponse.json(qarz, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
