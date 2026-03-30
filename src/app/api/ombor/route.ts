import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const kamQolgan = searchParams.get('kamQolgan') === 'true'
    const qidiruv = searchParams.get('q') || ''

    const tovarlar = await prisma.tovar.findMany({
      where: {
        holati: 'FAOL',
        ...(qidiruv ? { nomi: { contains: qidiruv, mode: 'insensitive' } } : {}),
      },
      include: {
        kategoriya: true,
        omborHarakati: { select: { miqdor: true, turi: true, joy: true } },
      },
      orderBy: { nomi: 'asc' },
    })

    const qoldiqlar = tovarlar.map((t) => {
      // Ombor qoldig'i: KIRIM(OMBOR) - OTKAZMA - CHIQIM(OMBOR) - YOQOTISH(OMBOR) + QAYTARISH(OMBOR)
      const omborQoldiq = t.omborHarakati.reduce((sum, h) => {
        if (h.joy === 'DOKON') return sum
        if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') return sum + Number(h.miqdor)
        if (h.turi === 'OTKAZMA') return sum - Number(h.miqdor)
        return sum - Number(h.miqdor) // CHIQIM, YOQOTISH
      }, 0)
      // Do'kon qoldig'i: OTKAZMA + KIRIM(DOKON) - CHIQIM(DOKON) + QAYTARISH(DOKON) - YOQOTISH(DOKON)
      const dokonQoldiq = t.omborHarakati.reduce((sum, h) => {
        if (h.turi === 'OTKAZMA') return sum + Number(h.miqdor)
        if (h.joy !== 'DOKON') return sum
        if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') return sum + Number(h.miqdor)
        return sum - Number(h.miqdor)
      }, 0)
      return {
        id: t.id,
        nomi: t.nomi,
        kategoriya: t.kategoriya,
        birlik: t.birlik,
        sotishNarxi: t.sotishNarxi,
        kelishNarxi: t.kelishNarxi,
        minimalQoldiq: t.minimalQoldiq,
        omborQoldiq: Math.max(0, omborQoldiq),
        dokonQoldiq: Math.max(0, dokonQoldiq),
        qoldiq: Math.max(0, omborQoldiq + dokonQoldiq),
        kamQolgan: (omborQoldiq + dokonQoldiq) <= t.minimalQoldiq,
      }
    })

    const natija = kamQolgan ? qoldiqlar.filter((q) => q.kamQolgan) : qoldiqlar

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
    const foydalanuvchiId = (session.user as any).id

    const harakat = await prisma.omborHarakati.create({
      data: {
        tovarId: data.tovarId,
        turi: data.turi || 'KIRIM',
        joy: data.joy || 'OMBOR',
        miqdor: parseFloat(data.miqdor),
        narx: parseFloat(data.narx),
        taminotchiId: data.taminotchiId || null,
        izoh: data.izoh || null,
        foydalanuvchiId,
      },
      include: { tovar: true, taminotchi: true },
    })

    return NextResponse.json(harakat, { status: 201 })
  } catch {
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
