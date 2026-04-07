import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { xabarQaytaYuborish } from '@/lib/telegram'

// POST — Barcha xato xabarlarni qayta yuborish
export async function POST(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.rol !== 'ADMIN') {
      return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 403 })
    }

    const xatolar = await prisma.bildirishnomLog.findMany({
      where: { status: { in: ['failed', 'queued'] }, xabarMatni: { not: null } },
      select: { id: true },
      take: 100,
    })

    let yuborilgan = 0
    let xatolik = 0

    for (const x of xatolar) {
      const natija = await xabarQaytaYuborish(x.id)
      if (natija.ok) yuborilgan++
      else xatolik++
    }

    return NextResponse.json({
      ok: true,
      jami: xatolar.length,
      yuborilgan,
      xatolik,
    })
  } catch (e) {
    console.error('[Xabar retry-all]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
