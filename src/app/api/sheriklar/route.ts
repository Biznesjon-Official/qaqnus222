import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    const sheriklar = await prisma.sherik.findMany({
      where: {
        faol: true,
        ...(q ? { ism: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: {
        qarzlar: {
          where: { holati: { in: ['OCHIQ', 'QISMAN'] } },
          select: { id: true },
        },
      },
      orderBy: { yaratilgan: 'desc' },
    })

    const natija = sheriklar.map(s => ({ ...s, ochiqQarzlar: s.qarzlar.length }))
    return NextResponse.json(natija)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { ism, telefon, telefon2, manzil, tavsif } = await req.json()
    if (!ism?.trim()) return NextResponse.json({ xato: 'Ism majburiy' }, { status: 400 })

    const sherik = await prisma.sherik.create({
      data: { ism: ism.trim(), telefon: telefon || null, telefon2: telefon2 || null, manzil: manzil || null, tavsif: tavsif || null },
    })

    return NextResponse.json(sherik, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
