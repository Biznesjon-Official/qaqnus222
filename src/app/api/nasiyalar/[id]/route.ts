import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const nasiya = await prisma.nasiya.findUnique({ where: { id } })
    if (!nasiya) return NextResponse.json({ xato: 'Nasiya topilmadi' }, { status: 404 })

    // Avval bog'liq yozuvlarni o'chirish
    await prisma.$transaction([
      prisma.nasiyaTolov.deleteMany({ where: { nasiyaId: id } }),
      prisma.bildirishnomLog.deleteMany({ where: { nasiyaId: id } }),
      prisma.nasiya.delete({ where: { id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
