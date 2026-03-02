import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Barcha mahsulotlarga birdan kirim qilish
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const foydalanuvchiId = (session.user as any).id
    const { miqdor, narx, taminotchiId, izoh } = await req.json()

    if (!miqdor || parseFloat(miqdor) <= 0) {
      return NextResponse.json({ xato: 'Miqdor noto\'g\'ri' }, { status: 400 })
    }

    // Barcha faol mahsulotlarni olish
    const tovarlar = await prisma.tovar.findMany({
      where: { holati: 'FAOL' },
      select: { id: true },
    })

    if (tovarlar.length === 0) {
      return NextResponse.json({ xato: 'Faol mahsulotlar topilmadi' }, { status: 400 })
    }

    // Barchasi uchun kirim harakati yaratish
    await prisma.omborHarakati.createMany({
      data: tovarlar.map(t => ({
        tovarId: t.id,
        turi: 'KIRIM',
        miqdor: parseFloat(miqdor),
        narx: parseFloat(narx) || 0,
        taminotchiId: taminotchiId || null,
        izoh: izoh || 'Ommaviy kirim',
        foydalanuvchiId,
      })),
    })

    return NextResponse.json({ muvaffaqiyat: true, soni: tovarlar.length }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
