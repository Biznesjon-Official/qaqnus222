import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function generateUniqueKod(): Promise<string> {
  while (true) {
    const n = Math.floor(100000000 + Math.random() * 900000000).toString()
    const kod = `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6, 9)}`
    const exists = await prisma.mijoz.findUnique({ where: { maxsus_kod: kod } })
    if (!exists) return kod
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const qidiruv = searchParams.get('q') || ''

    const mijozlar = await prisma.mijoz.findMany({
      where: qidiruv
        ? {
            OR: [
              { ism: { contains: qidiruv, mode: 'insensitive' } },
              { telefon: { contains: qidiruv } },
              { maxsus_kod: { contains: qidiruv } },
            ],
          }
        : {},
      include: {
        _count: { select: { sotuvlar: true, nasiyalar: true } },
        nasiyalar: {
          where: { holati: { in: ['OCHIQ', 'MUDDATI_OTGAN'] } },
          select: { qoldiq: true },
        },
      },
      orderBy: { ism: 'asc' },
    })

    const natija = mijozlar.map((m) => ({
      ...m,
      jami_qarz: m.nasiyalar.reduce((s, n) => s + Number(n.qoldiq), 0),
    }))

    return NextResponse.json(natija)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const data = await req.json()
    const maxsus_kod = await generateUniqueKod()
    const mijoz = await prisma.mijoz.create({
      data: { ism: data.ism, telefon: data.telefon, manzil: data.manzil, izoh: data.izoh, maxsus_kod },
    })
    return NextResponse.json(mijoz, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
