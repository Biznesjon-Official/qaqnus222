import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params

    const dokon = await prisma.sherikDokon.findUnique({
      where: { id },
      include: {
        sotuvlar: {
          where: { tolovUsuli: 'SHERIK' },
          include: { tarkiblar: { include: { tovar: { select: { nomi: true, birlik: true } } } } },
          orderBy: { sana: 'desc' },
        },
        tolovlar: { orderBy: { sana: 'desc' } },
      },
    })

    if (!dokon) return NextResponse.json({ xato: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(dokon)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    const { nomi, telefon, manzil, izoh } = await req.json()

    const dokon = await prisma.sherikDokon.update({
      where: { id },
      data: { nomi, telefon: telefon || null, manzil: manzil || null, izoh: izoh || null },
    })

    return NextResponse.json(dokon)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    const sotuvSoni = await prisma.sotuv.count({ where: { sherikDokonId: id } })
    if (sotuvSoni > 0) return NextResponse.json({ xato: `Bu sherikka ${sotuvSoni} ta sotuv bog'liq` }, { status: 400 })

    await prisma.sherikDokonTolov.deleteMany({ where: { sherikDokonId: id } })
    await prisma.sherikDokon.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
