import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { summa, izoh } = await req.json()
    const qoshilganSumma = new Prisma.Decimal(summa || 0)
    if (qoshilganSumma.lte(0)) {
      return NextResponse.json({ xato: 'Summa kiritilishi shart' }, { status: 400 })
    }

    const xarid = await prisma.xarid.findUnique({ where: { id } })
    if (!xarid) return NextResponse.json({ xato: 'Xarid topilmadi' }, { status: 404 })

    const yangiJamiSumma = xarid.jamiSumma.add(qoshilganSumma)
    const yangiQoldiqQarz = xarid.qoldiqQarz.add(qoshilganSumma)

    // Tranzaksiya: xarid summasi o'zgaradi + qarz tarixi yoziladi
    const yangilangan = await prisma.$transaction(async (tx) => {
      const updated = await tx.xarid.update({
        where: { id },
        data: {
          jamiSumma: yangiJamiSumma,
          qoldiqQarz: yangiQoldiqQarz,
        },
      })

      await tx.xaridQarzTarixi.create({
        data: {
          xaridId: id,
          summa: qoshilganSumma,
          izoh: izoh || 'Qarz qo\'shildi',
        },
      })

      return updated
    })

    return NextResponse.json(yangilangan)
  } catch (e) {
    console.error('[Xarid qarz]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
