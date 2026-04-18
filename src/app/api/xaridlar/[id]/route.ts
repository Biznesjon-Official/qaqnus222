import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * Xaridni butunlay o'chirish — hech bo'lmagandek.
 * Tranzaksiya ichida: tarkiblar, to'lovlar, qarz tarixi va xaridning o'zi
 * o'chiriladi. Xarid ombor harakatlarini yaratmaydi (u faqat moliyaviy
 * hujjat), shuning uchun ombor o'zgarmaydi.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const xarid = await prisma.xarid.findUnique({ where: { id } })
    if (!xarid) return NextResponse.json({ xato: 'Xarid topilmadi' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.xaridTarkibi.deleteMany({ where: { xaridId: id } })
      await tx.xaridTolov.deleteMany({ where: { xaridId: id } })
      await tx.xaridQarzTarixi.deleteMany({ where: { xaridId: id } })
      await tx.xarid.delete({ where: { id } })
    })

    return NextResponse.json({ muvaffaqiyat: true })
  } catch (e) {
    console.error('[Xarid DELETE]', e)
    return NextResponse.json({ xato: 'O\'chirib bo\'lmadi' }, { status: 500 })
  }
}
