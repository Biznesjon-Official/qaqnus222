import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const qidiruv = searchParams.get('q') || ''
    const kategoriyaId = searchParams.get('kategoriya') || ''
    const holati = searchParams.get('holati') || 'FAOL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (holati !== 'BARCHASI') where.holati = holati
    if (kategoriyaId) where.kategoriyaId = kategoriyaId
    if (qidiruv) {
      where.OR = [
        { nomi: { contains: qidiruv, mode: 'insensitive' } },
        { shtrixKod: { contains: qidiruv } },
      ]
    }

    const [tovarlar, jami] = await Promise.all([
      prisma.tovar.findMany({
        where,
        include: {
          kategoriya: true,
          omborHarakati: {
            select: { miqdor: true, turi: true },
          },
        },
        orderBy: { nomi: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tovar.count({ where }),
    ])

    // Hisoblash: qoldiq = kirim - chiqim - yo'qotish + qaytarish
    const tovarlarQoldiq = tovarlar.map((t) => {
      const qoldiq = t.omborHarakati.reduce((sum, h) => {
        if (h.turi === 'KIRIM' || h.turi === 'QAYTARISH') return sum + Number(h.miqdor)
        return sum - Number(h.miqdor)
      }, 0)
      return { ...t, qoldiq, omborHarakati: undefined }
    })

    return NextResponse.json({ tovarlar: tovarlarQoldiq, jami, page, limit })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const data = await req.json()

    // Shtrix kod yo'q bo'lsa auto-generate
    const autoShtrixKod = data.shtrixKod?.trim()
      || `OPT${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`

    const tovar = await prisma.tovar.create({
      data: {
        nomi: data.nomi,
        kategoriyaId: data.kategoriyaId,
        shtrixKod: autoShtrixKod,
        kelishNarxi: parseFloat(data.kelishNarxi),
        sotishNarxi: parseFloat(data.sotishNarxi),
        birlik: data.birlik || 'DONA',
        minimalQoldiq: parseInt(data.minimalQoldiq) || 5,
        rasmUrl: data.rasmUrl || null,
      },
      include: { kategoriya: true },
    })

    // Boshlang'ich ombor qoldig'i kiritilsa
    if (data.boshlangichQoldiq && parseFloat(data.boshlangichQoldiq) > 0) {
      await prisma.omborHarakati.create({
        data: {
          tovarId: tovar.id,
          turi: 'KIRIM',
          miqdor: parseFloat(data.boshlangichQoldiq),
          narx: parseFloat(data.kelishNarxi),
          izoh: 'Boshlang\'ich qoldiq',
          foydalanuvchiId: (session.user as any).id,
        },
      })
    }

    return NextResponse.json(tovar, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ xato: 'Bu shtrix-kod allaqachon mavjud' }, { status: 400 })
    }
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
