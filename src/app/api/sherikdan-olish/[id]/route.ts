import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * Sherikdan olishni butunlay o'chirish — hech bo'lmagandek.
 * Tranzaksiya ichida: bog'langan to'lovlar va sherikdan olishning o'zi
 * o'chiriladi.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const olish = await prisma.sherikdanOlish.findUnique({ where: { id } })
    if (!olish) return NextResponse.json({ xato: 'Topilmadi' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.sherikdanOlishTolov.deleteMany({ where: { sherikdanOlishId: id } })
      await tx.sherikdanOlish.delete({ where: { id } })
    })

    return NextResponse.json({ muvaffaqiyat: true })
  } catch (e) {
    console.error('[Sherikdan olish DELETE]', e)
    return NextResponse.json({ xato: 'O\'chirib bo\'lmadi' }, { status: 500 })
  }
}
