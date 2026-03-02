import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: "Ruxsat yo'q" }, { status: 401 })

    const foydalanuvchiId = (session.user as any).id
    const { tovarId, yangiQoldiq } = await req.json()

    if (!tovarId || yangiQoldiq === undefined || yangiQoldiq === null) {
      return NextResponse.json({ xato: "tovarId va yangiQoldiq majburiy" }, { status: 400 })
    }

    const yangi = parseFloat(yangiQoldiq)
    if (isNaN(yangi) || yangi < 0) {
      return NextResponse.json({ xato: "Noto'g'ri qoldiq" }, { status: 400 })
    }

    // Hozirgi qoldiqni hisoblash
    const harakatlar = await prisma.omborHarakati.findMany({
      where: { tovarId },
      select: { turi: true, miqdor: true },
    })

    const hozirgi = harakatlar.reduce((sum, h) => {
      const m = Number(h.miqdor)
      if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') return sum + m
      return sum - m
    }, 0)

    const farq = yangi - hozirgi

    if (Math.abs(farq) < 0.001) {
      return NextResponse.json({ ok: true, xabar: "Qoldiq o'zgarmadi" })
    }

    await prisma.omborHarakati.create({
      data: {
        tovarId,
        turi: farq > 0 ? 'KIRIM' : 'YOQOTISH',
        miqdor: Math.abs(farq),
        narx: 0,
        izoh: `Qoldiq sozlash: ${hozirgi.toFixed(2)} → ${yangi.toFixed(2)}`,
        foydalanuvchiId,
      },
    })

    return NextResponse.json({ ok: true, hozirgi, yangi, farq })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
