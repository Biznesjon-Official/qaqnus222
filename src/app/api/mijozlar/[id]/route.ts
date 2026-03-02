import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params

    // Bog'liq sotuvlar borligini tekshirish
    const sotuvSoni = await prisma.sotuv.count({ where: { mijozId: id } })
    if (sotuvSoni > 0) {
      return NextResponse.json(
        { xato: `Bu mijozga ${sotuvSoni} ta sotuv bog'liq. Avval sotuvlarni o'chiring.` },
        { status: 400 }
      )
    }

    // Nasiya borligini tekshirish
    const nasiyaSoni = await prisma.nasiya.count({ where: { mijozId: id } })
    if (nasiyaSoni > 0) {
      return NextResponse.json(
        { xato: `Bu mijozga ${nasiyaSoni} ta nasiya bog'liq. Avval nasiyalarni yoping.` },
        { status: 400 }
      )
    }

    await prisma.mijoz.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params
    const data = await req.json()

    const mijoz = await prisma.mijoz.update({
      where: { id },
      data: {
        ism: data.ism,
        telefon: data.telefon || null,
        manzil: data.manzil || null,
        izoh: data.izoh || null,
      },
    })
    return NextResponse.json(mijoz)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
