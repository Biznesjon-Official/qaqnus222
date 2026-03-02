import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const data = await req.json()
    const foydalanuvchiId = (session.user as any).id

    const nasiya = await prisma.nasiya.findUnique({ where: { id } })
    if (!nasiya) return NextResponse.json({ xato: 'Nasiya topilmadi' }, { status: 404 })

    const tolovSumma = parseFloat(data.summa)
    const yangiTolangan = Number(nasiya.tolangan) + tolovSumma
    const yangiQoldiq = Number(nasiya.jamiQarz) - yangiTolangan

    const [tolov, yangiNasiya] = await prisma.$transaction([
      prisma.nasiyaTolov.create({
        data: {
          nasiyaId: id,
          summa: tolovSumma,
          tolovUsuli: data.tolovUsuli || 'NAQD',
          qabulQiluvchiId: foydalanuvchiId,
          izoh: data.izoh,
        },
      }),
      prisma.nasiya.update({
        where: { id },
        data: {
          tolangan: yangiTolangan,
          qoldiq: Math.max(0, yangiQoldiq),
          holati: yangiQoldiq <= 0 ? 'YOPILGAN' : 'OCHIQ',
        },
      }),
    ])

    return NextResponse.json({ tolov, nasiya: yangiNasiya }, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
