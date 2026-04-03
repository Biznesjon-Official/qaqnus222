import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const holati = searchParams.get('holati') || ''
    const mijozId = searchParams.get('mijozId') || ''

    const where: any = { ochirilgan: false }
    if (holati) where.holati = holati
    if (mijozId) where.mijozId = mijozId

    const nasiyalar = await prisma.nasiya.findMany({
      where,
      include: {
        mijoz: true,
        sotuv: { select: { chekRaqami: true, sana: true } },
        tolovlar: { orderBy: { sana: 'desc' } },
      },
      orderBy: { sana: 'desc' },
    })

    return NextResponse.json(nasiyalar)
  } catch (e) {
    console.error('[Nasiyalar GET]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 })

    const body = await req.json()
    const { ism, manzil, telefon, qarz, muddat, sana } = body

    if (!ism || !qarz) {
      return NextResponse.json({ xato: 'Ism va qarz majburiy' }, { status: 400 })
    }

    // Telefon raqamdan faqat raqamlarni olish
    const cleanPhone = telefon ? telefon.replace(/\D/g, '') : null
    const finalPhone = cleanPhone && cleanPhone.length >= 9 ? `+${cleanPhone}` : null

    // Mijozni topish — ism bo'yicha qidirib, manzilni ham solishtirish (kichik harfda, probelsiz)
    const normalizeManzil = (m: string) => m.trim().toLowerCase().replace(/\s+/g, ' ')

    let mijoz = null
    if (manzil) {
      const candidates = await prisma.mijoz.findMany({
        where: { ism: { equals: ism, mode: 'insensitive' } },
      })
      mijoz = candidates.find(c =>
        c.manzil && normalizeManzil(c.manzil) === normalizeManzil(manzil)
      ) || null
    }

    if (!mijoz) {
      // Agar telefon bor bo'lsa, telefon bo'yicha ham tekshirish
      if (finalPhone) {
        mijoz = await prisma.mijoz.findFirst({
          where: { telefon: finalPhone },
        })
      }
    }

    if (!mijoz) {
      mijoz = await prisma.mijoz.create({
        data: {
          ism,
          manzil: manzil || null,
          telefon: finalPhone,
        },
      })
    } else {
      // Mavjud mijozni yangilash (telefon yoki manzil o'zgarganda)
      const updateData: any = {}
      if (finalPhone && mijoz.telefon !== finalPhone) updateData.telefon = finalPhone
      if (manzil && mijoz.manzil !== manzil) updateData.manzil = manzil
      if (Object.keys(updateData).length > 0) {
        mijoz = await prisma.mijoz.update({
          where: { id: mijoz.id },
          data: updateData,
        })
      }
    }

    const nasiya = await prisma.nasiya.create({
      data: {
        mijozId: mijoz.id,
        jamiQarz: qarz,
        qoldiq: qarz,
        muddat: muddat ? new Date(muddat) : null,
        sana: sana ? new Date(sana) : new Date(),
      },
    })

    return NextResponse.json(nasiya, { status: 201 })
  } catch (e) {
    console.error('[Nasiyalar POST]', e)
    return NextResponse.json({ xato: 'Server xatosi' }, { status: 500 })
  }
}
