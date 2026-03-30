import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Ombordan do'konga o'tkazma
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const foydalanuvchiId = (session.user as any).id
    const { tovarId, miqdor, izoh } = await req.json()

    if (!tovarId || !miqdor || parseFloat(miqdor) <= 0) {
      return NextResponse.json({ xato: "Tovar va miqdor majburiy" }, { status: 400 })
    }

    const qty = parseFloat(miqdor)

    // Ombor qoldig'ini tekshirish
    const harakatlar = await prisma.omborHarakati.findMany({
      where: { tovarId },
      select: { turi: true, miqdor: true, joy: true },
    })

    const omborQoldiq = harakatlar.reduce((sum, h) => {
      if (h.joy === 'DOKON') return sum
      if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') return sum + Number(h.miqdor)
      if (h.turi === 'OTKAZMA') return sum - Number(h.miqdor)
      return sum - Number(h.miqdor)
    }, 0)

    if (qty > omborQoldiq) {
      return NextResponse.json({ xato: `Omborda yetarli emas. Mavjud: ${omborQoldiq}` }, { status: 400 })
    }

    // Tovar narxini olish
    const tovar = await prisma.tovar.findUnique({ where: { id: tovarId }, select: { kelishNarxi: true } })

    const harakat = await prisma.omborHarakati.create({
      data: {
        tovarId,
        turi: 'OTKAZMA',
        joy: 'OMBOR',
        miqdor: qty,
        narx: Number(tovar?.kelishNarxi || 0),
        izoh: izoh || "Ombordan do'konga o'tkazma",
        foydalanuvchiId,
      },
      include: { tovar: true },
    })

    return NextResponse.json(harakat, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
