import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { qarzQoshildiXabar } from '@/lib/telegram'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { summa } = await req.json()
    if (!summa || Number(summa) <= 0) {
      return NextResponse.json({ xato: 'Summa kiritilishi shart' }, { status: 400 })
    }

    const nasiya = await prisma.nasiya.findUnique({ where: { id } })
    if (!nasiya) return NextResponse.json({ xato: 'Nasiya topilmadi' }, { status: 404 })

    const qoshilganSumma = Number(summa)

    // YOPILGAN nasiyaga qarz qo'shilsa — shu mijoz uchun yangi nasiya yaratiladi
    if (nasiya.holati === 'YOPILGAN') {
      const yangi = await prisma.nasiya.create({
        data: {
          mijozId: nasiya.mijozId,
          jamiQarz: qoshilganSumma,
          qoldiq: qoshilganSumma,
          holati: 'OCHIQ',
          sana: new Date(),
        },
      })
      qarzQoshildiXabar(yangi.id, nasiya.mijozId, qoshilganSumma, qoshilganSumma)
        .catch(e => console.error('[Telegram] Qarz xabar xatosi:', e))
      return NextResponse.json({ yangiNasiya: true, nasiya: yangi }, { status: 201 })
    }

    const yangiJamiQarz = Number(nasiya.jamiQarz) + qoshilganSumma
    const yangiQoldiq = Number(nasiya.qoldiq) + qoshilganSumma

    const yangilangan = await prisma.nasiya.update({
      where: { id },
      data: {
        jamiQarz: yangiJamiQarz,
        qoldiq: yangiQoldiq,
        holati: 'OCHIQ',
      },
    })

    qarzQoshildiXabar(id, nasiya.mijozId, qoshilganSumma, yangiQoldiq)
      .catch(e => console.error('[Telegram] Qarz xabar xatosi:', e))

    return NextResponse.json(yangilangan)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
