import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { id } = await params

    // Bog'liq xaridlar borligini tekshirish
    const xaridSoni = await prisma.xarid.count({ where: { taminotchiId: id } })
    if (xaridSoni > 0) {
      return NextResponse.json(
        { xato: `Bu ta'minotchiga ${xaridSoni} ta xarid bog'liq. Avval xaridlarni o'chiring.` },
        { status: 400 }
      )
    }

    await prisma.taminotchi.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
