import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
    if (nasiya.holati === 'YOPILGAN') return NextResponse.json({ xato: 'Yopilgan nasiyaga qarz qo\'shib bo\'lmaydi' }, { status: 400 })

    const qoshilganSumma = Number(summa)
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

    return NextResponse.json(yangilangan)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
