import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const dokonlar = await prisma.sherikDokon.findMany({
      include: {
        sotuvlar: {
          where: { tolovUsuli: 'SHERIK' },
          select: { yakuniySumma: true },
        },
        tolovlar: { select: { summa: true } },
      },
      orderBy: { yaratilgan: 'desc' },
    })

    const natija = dokonlar.map(d => {
      const jami = d.sotuvlar.reduce((s, sv) => s + Number(sv.yakuniySumma), 0)
      const tolangan = d.tolovlar.reduce((s, t) => s + Number(t.summa), 0)
      return {
        id: d.id, nomi: d.nomi, telefon: d.telefon, manzil: d.manzil,
        izoh: d.izoh, yaratilgan: d.yaratilgan,
        jamiQarz: jami, tolangan, qoldiq: jami - tolangan,
      }
    })

    return NextResponse.json(natija)
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const { nomi, telefon, manzil, izoh } = await req.json()
    if (!nomi?.trim()) return NextResponse.json({ xato: 'Nomi majburiy' }, { status: 400 })

    const dokon = await prisma.sherikDokon.create({
      data: { nomi: nomi.trim(), telefon: telefon || null, manzil: manzil || null, izoh: izoh || null },
    })

    return NextResponse.json(dokon, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
