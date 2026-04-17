import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { qarzQoshildiXabar } from '@/lib/telegram'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { summa } = await req.json()
    const qoshilganSumma = new Prisma.Decimal(summa || 0)
    if (qoshilganSumma.lte(0)) {
      return NextResponse.json({ xato: 'Summa kiritilishi shart' }, { status: 400 })
    }

    const nasiya = await prisma.nasiya.findUnique({ where: { id } })
    if (!nasiya) return NextResponse.json({ xato: 'Nasiya topilmadi' }, { status: 404 })

    // YOPILGAN bo'lsa ham — shu nasiyani qayta ochamiz (yangi record yaratmaymiz)
    const yangiJamiQarz = nasiya.jamiQarz.add(qoshilganSumma)
    const yangiQoldiq = nasiya.qoldiq.add(qoshilganSumma)

    // Tranzaksiya: nasiya yangilash + qarz tarixi yaratish
    const yangilangan = await prisma.$transaction(async (tx) => {
      const updated = await tx.nasiya.update({
        where: { id },
        data: {
          jamiQarz: yangiJamiQarz,
          qoldiq: yangiQoldiq,
          holati: 'OCHIQ',
        },
      })

      // Qarz tarixi — qachon, qancha qo'shilganini saqlash
      await tx.nasiyaQarzTarixi.create({
        data: {
          nasiyaId: id,
          summa: qoshilganSumma,
          izoh: `Qarz qo'shildi`,
        },
      })

      return updated
    })

    qarzQoshildiXabar(id, nasiya.mijozId, qoshilganSumma.toNumber(), yangiQoldiq.toNumber())
      .then(r => { if (r && !r.ok) console.error('[Telegram] Qarz xabar xatosi:', r.xato) })
      .catch(e => console.error('[Telegram] Qarz xabar xatosi:', e))

    return NextResponse.json(yangilangan)
  } catch (e) {
    console.error('[Nasiya qarz]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
